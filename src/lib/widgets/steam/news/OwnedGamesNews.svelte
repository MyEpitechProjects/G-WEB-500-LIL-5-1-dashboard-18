<script lang="ts">
	import type { WidgetRenderProps } from '$lib/core/types';
	import type { NewsItem, OwnedGamesNewsParams } from './ownedGamesNews';

	let { data }: WidgetRenderProps<OwnedGamesNewsParams, NewsItem[]> = $props();

	const formatDate = (seconds: number): string =>
		new Date(seconds * 1000).toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
</script>

{#if data.length === 0}
	<p class="empty">Aucune actualité trouvée pour ces jeux.</p>
{:else}
	<ul>
		{#each data as item (item.id)}
			<li>
				<div class="game">
					{#if item.icon}<img src={item.icon} alt="" width="16" height="16" loading="lazy" />{/if}
					<span>{item.game}</span>
					<time datetime={new Date(item.date * 1000).toISOString()}>{formatDate(item.date)}</time>
				</div>
				{#if item.url}
					<a class="title" href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>
				{:else}
					<span class="title">{item.title}</span>
				{/if}
				{#if item.excerpt}<p class="excerpt">{item.excerpt}</p>{/if}
				{#if item.official}<span class="badge">Annonce officielle</span>{/if}
			</li>
		{/each}
	</ul>
{/if}

<style>
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.75rem;
	}

	li {
		display: grid;
		gap: 0.2rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--border);
	}

	li:last-child {
		border-bottom: 0;
		padding-bottom: 0;
	}

	.game {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	.game img {
		border-radius: 3px;
	}

	.game time {
		margin-left: auto;
	}

	.title {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text);
		text-decoration: none;
	}

	a.title:hover {
		color: var(--accent);
		text-decoration: underline;
	}

	.excerpt {
		margin: 0;
		font-size: 0.78rem;
		line-height: 1.4;
		color: var(--text-muted);
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.badge {
		justify-self: start;
		font-size: 0.65rem;
		color: var(--accent);
		border: 1px solid var(--accent);
		border-radius: 999px;
		padding: 0 0.45rem;
	}

	.empty {
		margin: 0;
		font-size: 0.8rem;
		color: var(--text-muted);
	}
</style>
