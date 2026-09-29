import { defineWidget } from '$lib/core/registry';
import CityTemperature from './CityTemperature.svelte';

export interface WeatherParams {
	city: string;
	unit: string;
	[key: string]: string | number | boolean;
}

export interface WeatherData {
	city: string;
	temperature: number;
	feelsLike: number;
	wind: number;
}

/**
 * Service sans compte : disponible par défaut pour tout utilisateur authentifié.
 * Open-Meteo ne demande pas de clé d'API et accepte les requêtes navigateur.
 */
export const cityTemperature = defineWidget<WeatherParams, WeatherData>({
	service: 'weather',
	name: 'city_temperature',
	title: 'Température',
	description: 'Affiche la température actuelle d’une ville',
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
			label: 'Unité',
			type: 'select',
			default: 'c',
			options: [
				{ value: 'c', label: 'Celsius' },
				{ value: 'f', label: 'Fahrenheit' }
			]
		}
	],
	async load({ params, fetch, signal }) {
		const geoUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
		geoUrl.searchParams.set('name', params.city);
		geoUrl.searchParams.set('count', '1');
		geoUrl.searchParams.set('language', 'fr');

		const geoResponse = await fetch(geoUrl, { signal });
		if (!geoResponse.ok) throw new Error('Service de géocodage indisponible.');
		const geo = await geoResponse.json();
		const place = geo.results?.[0];
		if (!place) throw new Error(`Ville introuvable : ${params.city}`);

		const url = new URL('https://api.open-meteo.com/v1/forecast');
		url.searchParams.set('latitude', String(place.latitude));
		url.searchParams.set('longitude', String(place.longitude));
		url.searchParams.set('current', 'temperature_2m,apparent_temperature,wind_speed_10m');
		if (params.unit === 'f') url.searchParams.set('temperature_unit', 'fahrenheit');

		const response = await fetch(url, { signal });
		if (!response.ok) throw new Error('Service météo indisponible.');
		const { current } = await response.json();

		return {
			city: place.name,
			temperature: current.temperature_2m,
			feelsLike: current.apparent_temperature,
			wind: current.wind_speed_10m
		};
	},
	component: CityTemperature
});
