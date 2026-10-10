import { defineWidget } from '$lib/core/registry';
import Forecast from './Forecast.svelte';
import { geocodeCity, type GeoPlace } from './index';

export interface ForecastParams {
	city: string;
	days: number;
	unit: string;
	show_precipitation: boolean;
	show_wind: boolean;
	[key: string]: string | number | boolean;
}

export interface ForecastDay {
	date: string;
	code: number;
	min: number;
	max: number;
	precipitation: number;
	precipitationProbability: number;
	wind: number;
}

export interface ForecastData {
	city: string;
	days: ForecastDay[];
}

interface ForecastResponse {
	daily: {
		time: string[];
		weather_code: number[];
		temperature_2m_max: number[];
		temperature_2m_min: number[];
		precipitation_sum: number[];
		precipitation_probability_max: (number | null)[];
		wind_speed_10m_max: number[];
	};
}

function createForecastUrl(place: GeoPlace, params: ForecastParams): URL {
	const days = Math.min(Math.max(Math.trunc(Number(params.days)) || 5, 1), 7);
	const url = new URL('https://api.open-meteo.com/v1/forecast');
	url.searchParams.set('latitude', String(place.latitude));
	url.searchParams.set('longitude', String(place.longitude));
	url.searchParams.set(
		'daily',
		[
			'weather_code',
			'temperature_2m_max',
			'temperature_2m_min',
			'precipitation_sum',
			'precipitation_probability_max',
			'wind_speed_10m_max'
		].join(',')
	);
	url.searchParams.set('forecast_days', String(days));
	url.searchParams.set('timezone', 'auto');
	if (params.unit === 'f') url.searchParams.set('temperature_unit', 'fahrenheit');
	return url;
}

export const cityForecast = defineWidget<ForecastParams, ForecastData>({
	service: 'weather',
	name: 'city_forecast',
	title: 'Prévisions météo',
	description: 'Affiche les prévisions des prochains jours pour une ville',
	defaultRefresh: 1800,
	minRefresh: 300,
	size: { w: 1, h: 2 },
	params: [
		{
			name: 'city',
			label: 'Ville',
			type: 'string',
			default: 'Paris',
			required: true,
			placeholder: 'Ex: Lille'
		},
		{
			name: 'days',
			label: 'Nombre de jours',
			type: 'integer',
			default: 5,
			required: true,
			min: 1,
			max: 7,
			help: 'Entre 1 et 7 jours.'
		},
		{
			name: 'unit',
			label: 'Unité de température',
			type: 'select',
			default: 'c',
			required: true,
			options: [
				{ value: 'c', label: 'Celsius (°C)' },
				{ value: 'f', label: 'Fahrenheit (°F)' }
			]
		},
		{
			name: 'show_precipitation',
			label: 'Afficher les précipitations',
			type: 'boolean',
			default: true,
			required: false
		},
		{
			name: 'show_wind',
			label: 'Afficher le vent maximal',
			type: 'boolean',
			default: false,
			required: false
		}
	],

	async load({ params, fetch, signal }) {
		const place = await geocodeCity(params.city, fetch, signal);
		const response = await fetch(createForecastUrl(place, params), { signal });
		if (!response.ok) throw new Error('Service météo indisponible.');
		const { daily }: ForecastResponse = await response.json();

		return {
			city: place.name,
			days: daily.time.map((date, i) => ({
				date,
				code: daily.weather_code[i],
				min: daily.temperature_2m_min[i],
				max: daily.temperature_2m_max[i],
				precipitation: daily.precipitation_sum[i],
				precipitationProbability: daily.precipitation_probability_max[i] ?? 0,
				wind: daily.wind_speed_10m_max[i]
			}))
		};
	},
	component: Forecast
});