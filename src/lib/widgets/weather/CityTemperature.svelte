<script lang="ts">
	import type { WidgetRenderProps } from '$lib/core/types';
	import type { WeatherData, WeatherParams } from './index';

	let { data, params }: WidgetRenderProps<WeatherParams, WeatherData> = $props();
</script>

<div class="temperature">
	<p class="city">{data.city}</p>
	<p class="value">{Math.round(data.temperature)}<span>°{params.unit === 'f' ? 'F' : 'C'}</span></p>
	<p class="detail">Ressenti {Math.round(data.feelsLike)}° · vent {Math.round(data.wind)} km/h</p>
</div>

<style>
	.temperature {
		display: grid;
		gap: 0.15rem;
		align-content: center;
		height: 100%;
	}

	.city {
		margin: 0;
		font-size: 0.8rem;
		color: var(--text-muted);
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
</style>
