<script lang="ts">
	import DashboardGrid from '$lib/components/DashboardGrid.svelte';
	import WidgetDialog from '$lib/components/WidgetDialog.svelte';
	import { dashboard } from '$lib/stores/dashboard.svelte';
	import type { WidgetInstance } from '$lib/core/types';

	let { data } = $props();

	let dialog = $state<{ open: boolean; instance: WidgetInstance | null; error: string | null }>({
		open: false,
		instance: null,
		error: null
	});

	$effect(() => dashboard.init(data.instances));

	function openAdd(): void {
		dialog = { open: true, instance: null, error: null };
	}

	function openConfigure(instance: WidgetInstance): void {
		dialog = { open: true, instance, error: null };
	}

	function close(): void {
		dialog = { open: false, instance: null, error: null };
	}

	async function submit(result: {
		service: string;
		widget: string;
		params: Record<string, string | number | boolean | string[]>;
		refreshRate: number;
	}): Promise<void> {
		try {
			if (dialog.instance) {
				await dashboard.update(dialog.instance.id, {
					params: result.params,
					refreshRate: result.refreshRate
				});
			} else {
				await dashboard.add(result.service, result.widget, result.params, result.refreshRate);
			}
			close();
		} catch (e) {
			dialog.error = e instanceof Error ? e.message : 'Action impossible.';
		}
	}
</script>

<svelte:head><title>Mon dashboard</title></svelte:head>

<div class="toolbar">
	<h1>Mon dashboard</h1>
	<button onclick={openAdd}>Ajouter un widget</button>
</div>

{#if dashboard.error}<p class="error" role="alert">{dashboard.error}</p>{/if}

{#if dashboard.instances.length === 0}
	<p class="empty">
		Votre dashboard est vide. Ajoutez un premier widget pour commencer, ou abonnez-vous à d’autres
		services depuis la page <a href="/services">Services</a>.
	</p>
{:else}
	<DashboardGrid onconfigure={openConfigure} />
{/if}

{#if dialog.open}
	<WidgetDialog
		instance={dialog.instance}
		subscribed={data.subscribed}
		error={dialog.error}
		onclose={close}
		onsubmit={submit}
	/>
{/if}

<style>
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	h1 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.toolbar button {
		font: inherit;
		font-size: 0.82rem;
		padding: 0.35rem 0.8rem;
		border-radius: 5px;
		border: 1px solid var(--accent);
		background: var(--accent);
		color: #06121f;
		font-weight: 600;
		cursor: pointer;
	}

	.empty {
		color: var(--text-muted);
		font-size: 0.85rem;
	}

	.empty a {
		color: var(--accent);
	}

	.error {
		color: var(--danger);
		font-size: 0.85rem;
	}
</style>
