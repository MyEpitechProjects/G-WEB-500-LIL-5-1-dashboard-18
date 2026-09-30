import { defineWidget } from '$lib/core/registry';
import CityTemperature from './CityTemperature.svelte';

export interface WeatherParams {
	city: string;
	unit: string;
	wind_unit: string;
	mode: string;
	show_humidity: boolean;
	show_wind_direction: boolean;
	show_precipitation: boolean;
	show_cloud_cover: boolean;
	[key: string]: string | number | boolean;
}

export interface WeatherData {
	city: string;
	temperature: number;
	feelsLike: number;
	wind: number;
	windDirection: number;
	humidity: number;
	precipitation: number;
	cloudCover: number;
}

interface GeoPlace {
	name: string;
	latitude: number;
	longitude: number;
}

interface GeoResponse {
	results?: GeoPlace[];
}

interface WeatherCurrent {
	temperature_2m: number;
	apparent_temperature: number;
	wind_speed_10m: number;
	wind_direction_10m: number;
	relative_humidity_2m: number;
	precipitation: number;
	cloud_cover: number;
}

interface WeatherResponse {
	current: WeatherCurrent;
}

async function geocodeCity(city: string, fetch: typeof globalThis.fetch, signal: AbortSignal): Promise<GeoPlace> {
	const url = new URL(
		'https://geocoding-api.open-meteo.com/v1/search'
	);
	url.searchParams.set('name', city);
	url.searchParams.set('count', '1');
	url.searchParams.set('language', 'fr');

	const response = await fetch(url, { signal });

	if (!response.ok) {
		throw new Error(
			'Service de géocodage indisponible.'
		);
	}
	const data: GeoResponse = await response.json();
	const place = data.results?.[0];

	if (!place) {
		throw new Error(`Ville introuvable : ${city}`);
	}
	return place;
}

function createWeatherUrl(place: GeoPlace, params: WeatherParams): URL {
	const url = new URL(
		'https://api.open-meteo.com/v1/forecast'
	);

	url.searchParams.set(
		'latitude',
		String(place.latitude)
	);

	url.searchParams.set(
		'longitude',
		String(place.longitude)
	);

	url.searchParams.set(
		'current',
		[
			'temperature_2m',
			'apparent_temperature',
			'wind_speed_10m',
			'wind_direction_10m',
			'relative_humidity_2m',
			'precipitation',
			'cloud_cover'
		].join(',')
	);

	setTemperatureUnit(url, params.unit);
	setWindUnit(url, params.wind_unit);

	return url;
}

function setTemperatureUnit(
	url: URL,
	unit: string
): void {
	if (unit === 'f') {
		url.searchParams.set(
			'temperature_unit',
			'fahrenheit'
		);
	}
}

function setWindUnit(
	url: URL,
	unit: string
): void {
	const windUnit = {
		kmh: 'kmh',
		ms: 'ms',
		mph: 'mph',
		kn: 'kn'
	}[unit] ?? 'kmh';

	url.searchParams.set(
		'wind_speed_unit',
		windUnit
	);
}

async function fetchWeather(
	url: URL,
	fetch: typeof globalThis.fetch,
	signal: AbortSignal
): Promise<WeatherCurrent> {
	const response = await fetch(url, { signal });

	if (!response.ok) {
		throw new Error(
			'Service météo indisponible.'
		);
	}

	const data: WeatherResponse = await response.json();

	return data.current;
}

function formatWeatherData(
	place: GeoPlace,
	current: WeatherCurrent
): WeatherData {
	return {
		city: place.name,
		temperature: current.temperature_2m,
		feelsLike: current.apparent_temperature,
		wind: current.wind_speed_10m,
		windDirection: current.wind_direction_10m,
		humidity: current.relative_humidity_2m,
		precipitation: current.precipitation,
		cloudCover: current.cloud_cover
	};
}

export const cityTemperature = defineWidget<WeatherParams, WeatherData>({
	service: 'weather',
	name: 'city_temperature',
	title: 'Température',
	description: 'Affiche la météo actuelle d’une ville',
	defaultRefresh: 600,
	minRefresh: 60,
	size: { w: 1, h: 1 },
	params: [
		{
			name: 'city',
			label: 'Ville',
			type: 'string',
			default: 'Paris',
			required: true,
			placeholder: 'Ivry-sur-Seine'
		},
		{
			name: 'unit',
			label: 'Unité de température',
			type: 'select',
			default: 'c',
			options: [
				{ value: 'c', label: 'Celsius (°C)' },
				{ value: 'f', label: 'Fahrenheit (°F)' }
			]
		},
		{
			name: 'wind_unit',
			label: 'Unité du vent',
			type: 'select',
			default: 'kmh',
			options: [
				{ value: 'kmh', label: 'km/h' },
				{ value: 'ms', label: 'm/s' },
				{ value: 'mph', label: 'mph' },
				{ value: 'kn', label: 'nœuds' }
			]
		},
		{
			name: 'mode',
			label: 'Mode d’affichage',
			type: 'select',
			default: 'detailed',
			options: [
				{ value: 'compact', label: 'Compact' },
				{ value: 'detailed', label: 'Détaillé' },
				{ value: 'temperature', label: 'Température uniquement' },
				{ value: 'wind', label: 'Vent' },
				{ value: 'precipitation', label: 'Précipitations' }
			]
		},
		{
			name: 'show_humidity',
			label: 'Afficher l’humidité',
			type: 'boolean',
			default: true,
			required: false
		},
		{
			name: 'show_wind_direction',
			label: 'Afficher la direction du vent',
			type: 'boolean',
			default: true,
			required: false
		},
		{
			name: 'show_precipitation',
			label: 'Afficher les précipitations',
			type: 'boolean',
			default: true,
			required: false
		},
		{
			name: 'show_cloud_cover',
			label: 'Afficher la couverture nuageuse',
			type: 'boolean',
			default: false,
			required: false
		}
	],

	async load({ params, fetch, signal }) {
		const place = await geocodeCity(
			params.city,
			fetch,
			signal
		);
		const weatherUrl = createWeatherUrl(
			place,
			params
		);
		const current = await fetchWeather(
			weatherUrl,
			fetch,
			signal
		);
		return formatWeatherData(
			place,
			current
		);
	},
	component: CityTemperature
});
