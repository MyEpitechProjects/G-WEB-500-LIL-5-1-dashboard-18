<script lang="ts">
	import type { WidgetRenderProps } from '$lib/core/types';
	import type { JourneysParams } from './index';

	let { data, params }: WidgetRenderProps<JourneysParams, any> = $props();

	function formatTime(navitiaTime: string) {
		if (!navitiaTime) return '';
		// Format: YYYYMMDDTHHMMSS
		const year = navitiaTime.substring(0, 4);
		const month = navitiaTime.substring(4, 6);
		const day = navitiaTime.substring(6, 8);
		const hour = navitiaTime.substring(9, 11);
		const minute = navitiaTime.substring(11, 13);
		return `${hour}h${minute}`;
	}
	
	function formatDuration(seconds: number) {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`;
		return `${m} min`;
	}
</script>

<div class="sncf-widget">
	<div class="header">
		<h4>Itinéraire</h4>
		<div class="route">
			<span class="station">{params.from}</span>
			<span class="arrow">➔</span>
			<span class="station">{params.to}</span>
		</div>
	</div>

	{#if data?.error}
		<p class="error">{data.error}</p>
	{:else if !data || !data.journeys || data.journeys.length === 0}
		<p class="empty">Aucun trajet trouvé.</p>
	{:else}
		<ul class="journeys">
			{#each data.journeys.slice(0, 4) as journey}
				<li class="journey">
					<div class="times">
						<span class="depart">{formatTime(journey.departure_date_time)}</span>
						<span class="arrive">{formatTime(journey.arrival_date_time)}</span>
					</div>
					<div class="duration">
						{formatDuration(journey.duration)}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.sncf-widget {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 1rem;
		background: #ffffff;
		color: #333;
		border-radius: 8px;
		overflow-y: auto;
		box-shadow: 0 2px 8px rgba(0,0,0,0.05);
	}

	.header {
		margin-bottom: 15px;
		padding-bottom: 10px;
		border-bottom: 1px solid #eee;
	}

	h4 {
		margin: 0 0 5px 0;
		color: #0088CE;
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.route {
		display: flex;
		align-items: center;
		gap: 10px;
		font-weight: bold;
		font-size: 1.1rem;
	}

	.arrow {
		color: #aaa;
		font-size: 0.9rem;
	}

	.journeys {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.journey {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 12px;
		background: #f8f9fa;
		border-radius: 6px;
		border-left: 4px solid #0088CE;
	}

	.times {
		display: flex;
		flex-direction: column;
		font-weight: bold;
	}

	.depart {
		color: #222;
	}

	.arrive {
		color: #666;
		font-size: 0.85rem;
	}

	.duration {
		font-size: 0.9rem;
		color: #555;
		background: #e9ecef;
		padding: 3px 8px;
		border-radius: 12px;
	}

	.error {
		color: #d9534f;
		font-size: 0.9rem;
		text-align: center;
		margin-top: 20px;
	}

	.empty {
		color: #888;
		font-size: 0.9rem;
		text-align: center;
		margin-top: 20px;
	}
</style>
