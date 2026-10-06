<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
</script>

<svelte:head><title>Services · Dashboard</title></svelte:head>

<h1>Services</h1>
<p class="lead">
	Abonnez-vous aux services dont vous voulez utiliser les widgets. Certains demandent de lier votre
	compte externe.
</p>

{#if data.notice || form?.notice}<p class="notice" role="status">{form?.notice ?? data.notice}</p>{/if}
{#if data.error || form?.error}<p class="error" role="alert">{form?.error ?? data.error}</p>{/if}

<ul class="services">
	{#each data.services as service (service.name)}
		<li class="service">
			<div>
				<h2>{service.label}</h2>
				<p>{service.description}</p>
				<p class="meta">
					{service.widgets} widget{service.widgets > 1 ? 's' : ''}
					{#if service.defaultSubscribed}· inclus d’office
					{:else if service.subscribed}· abonné{service.linked ? ' · compte lié' : ''}
					{/if}
				</p>
			</div>

			{#if service.defaultSubscribed}
				<span class="badge">Actif</span>
			{:else if service.subscribed}
				<form method="POST" action="?/unsubscribe" use:enhance>
					<input type="hidden" name="service" value={service.name} />
					<button type="submit" class="ghost">Se désabonner</button>
				</form>
			{:else}
				<form method="POST" action="?/subscribe" use:enhance>
					<input type="hidden" name="service" value={service.name} />
					<button type="submit">
						{service.provider ? 'Lier mon compte et s’abonner' : 'S’abonner'}
					</button>
				</form>
			{/if}
		</li>
	{/each}
</ul>

<style>
	h1 {
		margin: 0 0 0.25rem;
		font-size: 1.1rem;
	}

	.lead {
		margin: 0 0 1rem;
		color: var(--text-muted);
		font-size: 0.85rem;
	}

	.notice,
	.error {
		font-size: 0.85rem;
		margin: 0 0 1rem;
	}

	.error {
		color: var(--danger);
	}

	.services {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.75rem;
		max-width: 44rem;
	}

	.service {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.9rem 1rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 6px;
	}

	h2 {
		margin: 0 0 0.2rem;
		font-size: 0.95rem;
	}

	.service p {
		margin: 0;
		font-size: 0.82rem;
		color: var(--text-muted);
	}

	.service .meta {
		margin-top: 0.3rem;
		font-size: 0.74rem;
	}

	button {
		font: inherit;
		font-size: 0.82rem;
		font-weight: 600;
		padding: 0.4rem 0.8rem;
		border-radius: 5px;
		border: 1px solid var(--accent);
		background: var(--accent);
		color: #06121f;
		cursor: pointer;
		white-space: nowrap;
	}

	button.ghost {
		background: transparent;
		border-color: var(--border);
		color: var(--text);
		font-weight: 400;
	}

	.badge {
		font-size: 0.75rem;
		color: var(--text-muted);
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 0.15rem 0.6rem;
	}

	@media (max-width: 36rem) {
		.service {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
