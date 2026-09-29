<script lang="ts">
	import DashboardGrid from '$lib/components/DashboardGrid.svelte';
	import WidgetDialog from '$lib/components/WidgetDialog.svelte';
	import { dashboard } from '$lib/stores/dashboard.svelte';
	import type { WidgetInstance } from '$lib/core/types';

	let dialog = $state<{ open: boolean; instance: WidgetInstance | null }>({
		open: false,
		instance: null
	});

	$effect(() => dashboard.load());

	function openAdd(): void {
		dialog = { open: true, instance: null };
	}

	function openConfigure(instance: WidgetInstance): void {
		dialog = { open: true, instance };
	}

	function close(): void {
		dialog = { open: false, instance: null };
	}

	function submit(result: {
		service: string;
		widget: string;
		params: Record<string, string | number | boolean>;
		refreshRate: number;
	}): void {
		if (dialog.instance) {
			dashboard.update(dialog.instance.id, {
				params: result.params,
				refreshRate: result.refreshRate
			});
		} else {
			dashboard.add(result.service, result.widget, result.params, result.refreshRate);
		}
		close();
	}
</script>

<svelte:head><title>Dashboard</title></svelte:head>

<header class="topbar">
	<h1>Dashboard</h1>
	<button onclick={openAdd}>Ajouter un widget</button>
</header>

<main>
	{#if dashboard.instances.length === 0}
		<p class="empty">Votre dashboard est vide. Ajoutez un premier widget pour commencer.</p>
	{:else}
		<DashboardGrid onconfigure={openConfigure} />
	{/if}
</main>

{#if dialog.open}
	<WidgetDialog instance={dialog.instance} onclose={close} onsubmit={submit} />
{/if}

<style>
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.9rem 1.25rem;
		border-bottom: 1px solid var(--border);
	}

	h1 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0.01em;
	}

	.topbar button {
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

	main {
		padding: 1.25rem;
	}

	.empty {
		color: var(--text-muted);
		font-size: 0.85rem;
	}
</style>
