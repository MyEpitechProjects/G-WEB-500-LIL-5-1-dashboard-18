<script lang="ts">
	import type { WidgetRenderProps } from '$lib/core/types';
	import type { ForecastData, ForecastParams } from './forecast';

	let { data, params }: WidgetRenderProps<ForecastParams, ForecastData> = $props();

	const unit = $derived(params.unit === 'f' ? 'F' : 'C');

	function describe(code: number): { icon: string; label: string } {
		if (code === 0) return { icon: '☀️', label: 'Ciel dégagé' };
		if (code <= 2) return { icon: '🌤️', label: 'Éclaircies' };
		if (code === 3) return { icon: '☁️', label: 'Couvert' };
		if (code <= 48) return { icon: '🌫️', label: 'Brouillard' };
		if (code <= 57) return { icon: '🌦️', label: 'Bruine' };
		if (code <= 67) return { icon: '🌧️', label: 'Pluie' };
		if (code <= 77) return { icon: '❄️', label: 'Neige' };
		if (code <= 82) return { icon: '🌦️', label: 'Averses' };
		if (code <= 86) return { icon: '🌨️', label: 'Averses de neige' };
		return { icon: '⛈️', label: 'Orage' };
	}

	function dayLabel(date: string, index: number): string {
		if (index === 0) return 'Auj.';
		return new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', {
			weekday: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="forecast">
	<p class="city">{data.city}</p>

	<ul>
		{#each data.days as day, index (day.date)}
			{@const weather = describe(day.code)}
			<li>
				<span class="day">{dayLabel(day.date, index)}</span>
				<span class="icon" role="img" aria-label={weather.label} title={weather.label}>
					{weather.icon}
				</span>
				<span class="temps">
					<strong>{Math.round(day.max)}°</strong>
					<span class="min">{Math.round(day.min)}°{unit}</span>
				</span>
				{#if params.show_precipitation}
					<span class="extra" title="Précipitations">💧 {day.precipitation.toFixed(1)} mm</span>
				{/if}
				{#if params.show_wind}
					<span class="extra" title="Vent maximal">💨 {Math.round(day.wind)} km/h</span>
				{/if}
			</li>
		{/each}
	</ul>
</div>

<style>
	.forecast {
		display: grid;
		gap: 0.4rem;
		min-width: 0;
	}

	.city {
		margin: 0;
		font-size: 0.8rem;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.25rem;
	}

	li {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.15rem 0.6rem;
		padding: 0.3rem 0;
		border-bottom: 1px solid var(--border);
		font-size: 0.8rem;
		min-width: 0;
	}

	li:last-child {
		border-bottom: 0;
	}

	.day {
		width: 3.2rem;
		flex-shrink: 0;
		text-transform: capitalize;
		color: var(--text-muted);
	}

	.icon {
		font-size: 1.1rem;
		flex-shrink: 0;
	}

	.temps {
		display: flex;
		align-items: baseline;
		gap: 0.35rem;
		margin-right: auto;
	}

	.min {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.extra {
		font-size: 0.72rem;
		color: var(--text-muted);
		white-space: nowrap;
	}
</style>