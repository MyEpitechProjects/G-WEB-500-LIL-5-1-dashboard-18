<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { WidgetStatus } from '$lib/core/types';

	let {
		title,
		subtitle = '',
		status,
		error = null,
		refreshing = false,
		lastUpdate = null,
		onrefresh,
		onconfigure,
		onremove,
		children
	}: {
		title: string;
		subtitle?: string;
		status: WidgetStatus;
		error?: string | null;
		refreshing?: boolean;
		lastUpdate?: number | null;
		onrefresh: () => void;
		onconfigure: () => void;
		onremove: () => void;
		children: Snippet;
	} = $props();

	const updatedLabel = $derived(
		lastUpdate === null
			? ''
			: new Date(lastUpdate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
	);
</script>

<article class="widget" class:refreshing>
	<header data-drag-handle title="Glisser pour déplacer le widget">
		<div class="heading">
			<h2>{title}</h2>
			{#if subtitle}<p class="subtitle">{subtitle}</p>{/if}
		</div>
		<div class="actions">
			<button onclick={onrefresh} title="Actualiser maintenant" aria-label="Actualiser">&#8635;</button>
			<button onclick={onconfigure} title="Configurer" aria-label="Configurer">&#9881;</button>
			<button onclick={onremove} title="Retirer du dashboard" aria-label="Retirer">&#10005;</button>
		</div>
	</header>

	<div class="body">
		{#if status === 'loading'}
			<p class="state">Chargement…</p>
		{:else if status === 'error'}
			<p class="state error">{error ?? 'Les données n’ont pas pu être chargées.'}</p>
			<button class="retry" onclick={onrefresh}>Réessayer</button>
		{:else if status === 'ready'}
			{@render children()}
		{/if}
	</div>

	{#if updatedLabel}
		<footer>Mis à jour à {updatedLabel}</footer>
	{/if}
</article>

<style>
	.widget {
		display: flex;
		flex-direction: column;
		min-height: 0;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 6px;
		overflow: hidden;
	}

	header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.6rem 0.75rem;
		border-bottom: 1px solid var(--border);
		cursor: grab;
		/* le texte de l'entête ne doit pas se sélectionner pendant le glisser */
		user-select: none;
	}

	header:active {
		cursor: grabbing;
	}

	/* les boutons d'action gardent leur curseur normal */
	header button {
		cursor: pointer;
	}

	h2 {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.subtitle {
		margin: 0.1rem 0 0;
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.actions {
		display: flex;
		gap: 0.15rem;
		opacity: 0;
		transition: opacity 120ms;
	}

	.widget:hover .actions,
	.widget:focus-within .actions {
		opacity: 1;
	}

	.actions button {
		border: 0;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		padding: 0.15rem 0.3rem;
		border-radius: 4px;
		font-size: 0.85rem;
		line-height: 1;
	}

	@media (hover: none), (max-width: 40rem) {
		.actions {
			opacity: 1;
		}

		.actions button {
			padding: 0.4rem 0.55rem;
			font-size: 1rem;
		}
	}


	.actions button:hover {
		background: var(--surface-hover);
		color: var(--text);
	}

	.body {
		flex: 1;
		min-height: 0;
		overflow: auto;
		padding: 0.75rem;
	}

	.state {
		margin: 0;
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.state.error {
		color: var(--danger);
	}

	.retry {
		margin-top: 0.5rem;
		font-size: 0.75rem;
		padding: 0.2rem 0.5rem;
		background: var(--surface-hover);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text);
		cursor: pointer;
	}

	footer {
		padding: 0.35rem 0.75rem;
		border-top: 1px solid var(--border);
		font-size: 0.7rem;
		color: var(--text-muted);
	}

	.refreshing footer::after {
		content: ' · actualisation…';
	}
</style>