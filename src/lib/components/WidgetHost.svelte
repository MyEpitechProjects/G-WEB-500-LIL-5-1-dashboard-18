<script lang="ts">
	import { untrack } from 'svelte';
	import { getWidget } from '$lib/core/registry';
	import { timer } from '$lib/core/timer';
	import type { WidgetInstance, WidgetStatus } from '$lib/core/types';
	import WidgetFrame from './WidgetFrame.svelte';

	let {
		instance,
		onconfigure,
		onremove
	}: {
		instance: WidgetInstance;
		onconfigure: () => void;
		onremove: () => void;
	} = $props();

	const def = $derived(getWidget(instance.service, instance.widget));

	const id = $derived(instance.id);
	const paramsKey = $derived(JSON.stringify(instance.params));
	const refreshRate = $derived(instance.refreshRate);

	let status = $state<WidgetStatus>('idle');
	let data = $state<unknown>(undefined);
	let error = $state<string | null>(null);
	let lastUpdate = $state<number | null>(null);
	let refreshing = $state(false);

	let controller: AbortController | null = null;

	async function load(): Promise<void> {
		if (!def)
			return;
		controller?.abort();
		controller = new AbortController();
		const { signal } = controller;

		if (status === 'ready')
			refreshing = true;
		else status = 'loading';

		try {
			const result = await def.load({
				params: instance.params,
				fetch,
				signal,
				instanceId: instance.id
			});
			if (signal.aborted)
				return;
			data = result;
			error = null;
			status = 'ready';
			lastUpdate = Date.now();
		} catch (e) {
			if (signal.aborted)
				return;
			error = e instanceof Error ? e.message : String(e);
			status = data === undefined ? 'error' : 'ready';
		} finally {
			refreshing = false;
		}
	}

	$effect(() => {
		void paramsKey;
		const rate = refreshRate;
		const key = id;
		if (!def)
			return;
		untrack(() => void load());
		const unregister = timer.register(key, {
			intervalMs: rate * 1000,
			run: load
		});

		return () => {
			unregister();
			controller?.abort();
		};
	});
</script>

{#if !def}
	<WidgetFrame
		title="Widget indisponible"
		status="error"
		error={`Le widget « ${instance.service}.${instance.widget} » n’existe plus.`}
		onrefresh={() => {}}
		{onconfigure}
		{onremove}
	>
		{#snippet children()}{/snippet}
	</WidgetFrame>
{:else}
	<WidgetFrame
		title={def.title}
		subtitle={def.service}
		{status}
		{error}
		{refreshing}
		{lastUpdate}
		onrefresh={load}
		{onconfigure}
		{onremove}
	>
		{#snippet children()}
			<def.component {data} params={instance.params} refresh={load} />
		{/snippet}
	</WidgetFrame>
{/if}