<script lang="ts">
	import type { WidgetRenderProps } from '$lib/core/types';
	import type { SteamData, SteamParams } from './index';
	import { getWidgetHtml } from '$lib/widgets/steam/getWidget';
	import { mountSteamWidget } from '$lib/widgets/steam/mountSteamWidget';

	let { data, params }: WidgetRenderProps<SteamParams, SteamData> = $props();

	let index = $state(0);
	let current = $state<string | null>(null);

	$effect(() => {
		const appids = data.games;
		getWidgetHtml(appids[index % Math.max(appids.length, 1)]).then((html) => {
			current = html;
		});
	});

	function next(): void {
		const appids = data.games;
		index = (index + 1) % appids.length;
	}

	function previous(): void {
		const appids = data.games;
		index = (index - 1 + appids.length) % appids.length;
	}
</script>

{#if !current}
	<p class="empty">Ajoutez au moins un appid Steam dans la configuration.</p>
{:else}
	<div class="player">
		<div class="steam-host" use:mountSteamWidget={{ html: current, onNext: next }}></div>
		<div class="controls">
			<button onclick={previous} aria-label="Jeu précédent">&#8249;</button>
			<span>{index + 1} / {data.games.length}</span>
			<button onclick={next} aria-label="Jeu suivant">&#8250;</button>
		</div>
	</div>
{/if}

<style>
	.player {
		display: grid;
		grid-template-rows: 1fr auto;
		gap: 0.4rem;
		height: 100%;
	}

	.steam-host {
		width: 100%;
		height: 100%;
		border-radius: 4px;
		background: #1b2838;
		/* le contenu réel vit dans un Shadow DOM mis à l'échelle (0.7) par le
		   CSS injecté côté serveur ; overflow: hidden garantit qu'il ne
		   dépasse jamais ce cadre quelle que soit sa taille intrinsèque. */
		overflow: hidden;
	}

	.controls {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	.controls button {
		background: var(--surface-hover);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text);
		cursor: pointer;
		padding: 0 0.45rem;
		line-height: 1.4;
	}

	.empty {
		margin: 0;
		font-size: 0.8rem;
		color: var(--text-muted);
	}
</style>
