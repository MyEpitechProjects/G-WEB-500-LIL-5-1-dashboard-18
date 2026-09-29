<script lang="ts">
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

	let status = $state<WidgetStatus>('idle');
	let data = $state<unknown>(undefined);
	let error = $state<string | null>(null);
	let lastUpdate = $state<number | null>(null);
	let refreshing = $state(false);

	let controller: AbortController | null = null;

	async function load(): Promise<void> {
		if (!def) return;
		controller?.abort();
		controller = new AbortController();
		const { signal } = controller;

		if (status === 'ready') refreshing = true;
		else status = 'loading';

		try {
			const result = await def.load({
				params: instance.params,
				fetch,
				signal,
				instanceId: instance.id
			});
			if (signal.aborted) return;
			data = result;
			error = null;
			status = 'ready';
			lastUpdate = Date.now();
		} catch (e) {
			if (signal.aborted) return;
			error = e instanceof Error ? e.message : String(e);
			// on garde les dernières données valides si on en a
			status = data === undefined ? 'error' : 'ready';
		} finally {
			refreshing = false;
		}
	}

	// Se relance à chaque changement de config ou de période : les params et le
	// refreshRate sont lus ici, donc l'effet en dépend.
	$effect(() => {
		const _params = instance.params;
		const rate = instance.refreshRate;
		if (!def) return;

		void load();
		const unregister = timer.register(instance.id, {
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
