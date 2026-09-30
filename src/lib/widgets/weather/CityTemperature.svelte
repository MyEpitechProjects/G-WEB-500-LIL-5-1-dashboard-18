<script lang="ts">
	import type { WidgetRenderProps } from '$lib/core/types';
	import type { WeatherData, WeatherParams } from './index';

	let { data, params }: WidgetRenderProps<
		WeatherParams,
		WeatherData
	> = $props();

	function windDirection(degrees: number): string {
		const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
		const index = Math.round(degrees / 45) % 8;
		return directions[index];
	}

	function rounded(value: number): number {
		return Math.round(value);
	}

	// Expressions dérivées réactives Svelte 5
	const unit = $derived(params.unit === 'f' ? 'F' : 'C');
	
	const windUnitLabel = $derived.by(() => {
		switch (params.wind_unit) {
			case 'ms': return 'm/s';
			case 'mph': return 'mph';
			case 'kn': return 'nœuds';
			case 'kmh':
			default: return 'km/h';
		}
	});

	const direction = $derived(windDirection(data.windDirection));
</script>

<div
	class="temperature"
	class:compact={params.mode === 'compact'}
	class:detailed={params.mode === 'detailed'}
>
	<p class="city">{data.city}</p>

	{#if params.mode === 'wind'}

		<div class="main-value">
			<span class="icon">💨</span>
			<p class="value">
				{rounded(data.wind)}
				<span>{windUnitLabel}</span>
			</p>
		</div>

		{#if params.show_wind_direction}
			<p class="detail">
				Direction {direction} · {rounded(data.windDirection)}°
			</p>
		{/if}

	{:else if params.mode === 'precipitation'}

		<div class="main-value">
			<span class="icon">💧</span>
			<p class="value">
				{data.precipitation.toFixed(1)}
				<span>mm</span>
			</p>
		</div>

		<p class="detail">
			Précipitations actuelles
		</p>

	{:else}

		<div class="main-value">
			<p class="value">
				{rounded(data.temperature)}
				<span>°{unit}</span>
			</p>
		</div>

		{#if params.mode !== 'temperature'}
			<p class="detail">
				Ressenti {rounded(data.feelsLike)}°{unit}
			</p>
		{/if}

		{#if params.mode === 'detailed'}

			<div class="details">

				{#if params.show_humidity}
					<div class="detail-item">
						<span class="detail-icon">💧</span>
						<span>{rounded(data.humidity)}%</span>
					</div>
				{/if}

				<div class="detail-item">
					<span class="detail-icon">💨</span>
					<span>
						{rounded(data.wind)}
						{windUnitLabel}
					</span>
				</div>

				{#if params.show_wind_direction}
					<div class="detail-item">
						<span class="detail-icon">🧭</span>
						<span>
							{direction}
							{rounded(data.windDirection)}°
						</span>
					</div>
				{/if}

				{#if params.show_precipitation}
					<div class="detail-item">
						<span class="detail-icon">🌧️</span>
						<span>
							{data.precipitation.toFixed(1)} mm
						</span>
					</div>
				{/if}

				{#if params.show_cloud_cover}
					<div class="detail-item">
						<span class="detail-icon">☁️</span>
						<span>
							{rounded(data.cloudCover)}%
						</span>
					</div>
				{/if}

			</div>

		{:else if params.mode === 'compact'}

			<p class="detail">

				{#if params.show_humidity}
					💧 {rounded(data.humidity)}%
				{/if}

				{#if params.show_humidity && params.show_wind_direction}
					&nbsp;·&nbsp;
				{/if}

				💨 {rounded(data.wind)} {windUnitLabel}

				{#if params.show_wind_direction}
					&nbsp;·&nbsp;{direction}
				{/if}

			</p>

		{/if}

	{/if}

</div>

<style>
	.temperature {
		display: grid;
		gap: 0.25rem;
		align-content: center;
		height: 100%;
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

	.main-value {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.icon {
		font-size: 1.5rem;
	}

	.value {
		margin: 0;
		font-size: 2.6rem;
		font-weight: 300;
		line-height: 1;
	}

	.value span {
		font-size: 1.1rem;
		vertical-align: super;
	}

	.detail {
		margin: 0;
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.details {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.35rem 0.75rem;
		margin-top: 0.25rem;
	}

	.detail-item {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		min-width: 0;
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.detail-icon {
		flex-shrink: 0;
	}

	.compact {
		gap: 0.15rem;
	}

	.compact .value {
		font-size: 2.6rem;
	}

	.detailed {
		gap: 0.3rem;
	}

	.detailed .value {
		font-size: 2.3rem;
	}

	@media (max-width: 300px) {
		.value {
			font-size: 2.1rem;
		}

		.details {
			grid-template-columns: 1fr;
		}
	}
</style>