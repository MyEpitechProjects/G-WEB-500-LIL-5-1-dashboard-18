import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const TIMEOUT_MS = 8000;

interface GeoResult {
	name: string;
	country?: string;
	latitude: number;
	longitude: number;
}

export const GET: RequestHandler = async ({ url }) => {
	const city = (url.searchParams.get('city') ?? '').trim();
	const unit = url.searchParams.get('unit') === 'f' ? 'f' : 'c';
	if (city.length < 1 || city.length > 80)
		error(400, 'Invalid city.');
	const geoUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
	geoUrl.searchParams.set('name', city);
	geoUrl.searchParams.set('count', '1');
	geoUrl.searchParams.set('language', 'en');
	const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(TIMEOUT_MS) });
	if (!geoRes.ok)
		error(502, 'Geocoding service unavailable.');
	const place = ((await geoRes.json()) as { results?: GeoResult[] }).results?.[0];
	if (!place)
		error(404, `City not found: ${city}`);
	const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
	forecastUrl.searchParams.set('latitude', String(place.latitude));
	forecastUrl.searchParams.set('longitude', String(place.longitude));
	forecastUrl.searchParams.set('current', 'temperature_2m,relative_humidity_2m,wind_speed_10m');
	forecastUrl.searchParams.set('temperature_unit', unit === 'f' ? 'fahrenheit' : 'celsius');
	const res = await fetch(forecastUrl, { signal: AbortSignal.timeout(TIMEOUT_MS) });
	if (!res.ok)
		error(502, 'Weather service unavailable.');
	const { current } = (await res.json()) as {
		current: {
			temperature_2m: number;
			relative_humidity_2m: number;
			wind_speed_10m: number;
		};
	};
	return json({
		city: place.name,
		country: place.country ?? '',
		unit,
		temperature: current.temperature_2m,
		humidity: current.relative_humidity_2m,
		wind: current.wind_speed_10m
	});
};
