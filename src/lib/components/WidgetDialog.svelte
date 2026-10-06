<script lang="ts">
	import { defaultParams, getWidget, listServices } from '$lib/core/registry';
	import type { WidgetDefinition, WidgetInstance, WidgetParams } from '$lib/core/types';
	import ParamsForm from './ParamsForm.svelte';

	let {
		instance = null,
		subscribed,
		error = null,
		onclose,
		onsubmit
	}: {
		/** null = ajout, sinon reconfiguration */
		instance?: WidgetInstance | null;
		/** services auxquels l'utilisateur est abonné : seuls leurs widgets sont proposés */
		subscribed: string[];
		/** message d'erreur renvoyé par le serveur */
		error?: string | null;
		onclose: () => void;
		onsubmit: (result: {
			service: string;
			widget: string;
			params: WidgetParams;
			refreshRate: number;
		}) => void | Promise<void>;
	} = $props();

	const services = listServices().filter((s) => subscribed.includes(s.name));
	const editing = instance !== null;

	let selected = $state<WidgetDefinition | null>(
		instance ? (getWidget(instance.service, instance.widget) ?? null) : null
	);
	let params = $state<WidgetParams>(instance ? { ...instance.params } : {});
	let refreshRate = $state(instance?.refreshRate ?? 60);

	function select(def: WidgetDefinition): void {
		selected = def;
		params = defaultParams(def);
		refreshRate = def.defaultRefresh;
	}

	const missing = $derived(
		selected?.params
			.filter((p) => p.required && String(params[p.name] ?? '').trim() === '')
			.map((p) => p.label) ?? []
	);

	function confirm(): void {
		if (!selected || missing.length > 0) return;
		onsubmit({
			service: selected.service,
			widget: selected.name,
			params: { ...params },
			refreshRate: Math.max(refreshRate, selected.minRefresh ?? 1)
		});
	}
</script>

<div
	class="backdrop"
	role="presentation"
	onclick={(e) => e.target === e.currentTarget && onclose()}
>
	<div class="panel" role="dialog" aria-modal="true" aria-label={editing ? 'Configurer le widget' : 'Ajouter un widget'}>
		<header>
			<h2>{editing ? 'Configurer le widget' : 'Ajouter un widget'}</h2>
			<button onclick={onclose} aria-label="Fermer">&#10005;</button>
		</header>

		<div class="content">
			{#if !editing}
				<div class="catalog">
					{#each services as service (service.name)}
						<h3>{service.name}</h3>
						{#each service.widgets as def (def.name)}
							<button
								class="entry"
								class:selected={selected?.name === def.name && selected?.service === def.service}
								onclick={() => select(def)}
							>
								<strong>{def.title}</strong>
								<span>{def.description}</span>
							</button>
						{/each}
					{/each}
					{#if services.length === 0}
						<p class="empty">Aucun service disponible. <a href="/services">Gérer mes services</a></p>
					{:else}
						<p class="more"><a href="/services">Gérer mes services</a></p>
					{/if}
				</div>
			{/if}

			<div class="config">
				{#if selected}
					<ParamsForm
						specs={selected.params}
						bind:values={params}
						bind:refreshRate
						minRefresh={selected.minRefresh ?? 5}
					/>
				{:else}
					<p class="empty">Choisissez un widget pour le configurer.</p>
				{/if}
			</div>
		</div>

		<footer>
			{#if error}
				<span class="missing" role="alert">{error}</span>
			{:else if missing.length > 0}
				<span class="missing">À renseigner : {missing.join(', ')}</span>
			{/if}
			<button class="ghost" onclick={onclose}>Annuler</button>
			<button class="primary" disabled={!selected || missing.length > 0} onclick={confirm}>
				{editing ? 'Enregistrer' : 'Ajouter au dashboard'}
			</button>
		</footer>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgb(0 0 0 / 0.55);
		display: grid;
		place-items: center;
		padding: 1rem;
		z-index: 10;
	}

	.panel {
		width: min(46rem, 100%);
		max-height: 85vh;
		display: flex;
		flex-direction: column;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
	}

	header,
	footer {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
	}

	header {
		justify-content: space-between;
		border-bottom: 1px solid var(--border);
	}

	header h2 {
		margin: 0;
		font-size: 0.95rem;
	}

	header button {
		background: none;
		border: 0;
		color: var(--text-muted);
		cursor: pointer;
	}

	.content {
		display: grid;
		grid-template-columns: 16rem 1fr;
		min-height: 0;
		flex: 1;
	}

	.content:has(.catalog) {
		grid-template-columns: 16rem 1fr;
	}

	.content:not(:has(.catalog)) {
		grid-template-columns: 1fr;
	}

	.catalog {
		border-right: 1px solid var(--border);
		overflow: auto;
		padding: 0.75rem;
	}

	.catalog h3 {
		margin: 0.75rem 0 0.35rem;
		font-size: 0.72rem;
		color: var(--text-muted);
		font-weight: 600;
	}

	.catalog h3:first-child {
		margin-top: 0;
	}

	.entry {
		display: grid;
		gap: 0.15rem;
		width: 100%;
		text-align: left;
		padding: 0.45rem 0.55rem;
		border: 1px solid transparent;
		border-radius: 5px;
		background: none;
		color: var(--text);
		cursor: pointer;
	}

	.entry:hover {
		background: var(--surface-hover);
	}

	.entry.selected {
		border-color: var(--accent);
		background: var(--surface-hover);
	}

	.entry strong {
		font-size: 0.85rem;
		font-weight: 600;
	}

	.entry span {
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	.more {
		margin: 0.75rem 0 0;
		font-size: 0.72rem;
	}

	.more a,
	.empty a {
		color: var(--accent);
	}

	.config {
		padding: 1rem;
		overflow: auto;
	}

	.empty {
		margin: 0;
		font-size: 0.82rem;
		color: var(--text-muted);
	}

	footer {
		justify-content: flex-end;
		border-top: 1px solid var(--border);
	}

	.missing {
		margin-right: auto;
		font-size: 0.75rem;
		color: var(--danger);
	}

	footer button {
		font: inherit;
		font-size: 0.82rem;
		padding: 0.35rem 0.75rem;
		border-radius: 5px;
		cursor: pointer;
		border: 1px solid var(--border);
	}

	.ghost {
		background: transparent;
		color: var(--text);
	}

	.primary {
		background: var(--accent);
		border-color: var(--accent);
		color: #06121f;
		font-weight: 600;
	}

	.primary:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
