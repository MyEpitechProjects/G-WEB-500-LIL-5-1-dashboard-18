<script lang="ts">
	import type { WidgetRenderProps } from '$lib/core/types';
	import type { RssData, RssParams } from './index';

	let { data }: WidgetRenderProps<RssParams, RssData> = $props();
</script>

{#if data.items.length === 0}
	<p class="empty">Ce flux ne contient aucun article pour le moment.</p>
{:else}
	<ul>
		{#each data.items as item (item.link)}
			<li>
				<a href={item.link} target="_blank" rel="noreferrer">{item.title}</a>
				{#if item.date}<time>{item.date}</time>{/if}
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
		gap: 0.5rem;
	}

	li {
		display: grid;
		gap: 0.1rem;
	}

	a {
		color: var(--text);
		font-size: 0.82rem;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}

	time,
	.empty {
		font-size: 0.7rem;
		color: var(--text-muted);
	}
</style>
