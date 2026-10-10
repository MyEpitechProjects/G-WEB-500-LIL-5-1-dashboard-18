import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readConfig, writeConfig, type WidgetConfig } from '$lib/server/db';

const MIN_REFRESH = 5;

function parse(body: unknown): WidgetConfig {
	const b = (body ?? {}) as Record<string, unknown>;
	const city = typeof b.city === 'string' ? b.city.trim() : '';
	const refresh = Math.trunc(Number(b.refresh));
	if (city.length < 1 || city.length > 80)
		error(400, 'City must be 1-80 characters.');
	if (b.unit !== 'c' && b.unit !== 'f')
		error(400, 'Unit must be "c" or "f".');
	if (!Number.isFinite(refresh) || refresh < MIN_REFRESH || refresh > 86400) {
		error(400, `Refresh rate must be between ${MIN_REFRESH} and 86400 seconds.`);
	}
	return { city, unit: b.unit, refresh };
}

export const GET: RequestHandler = () => json(readConfig());

export const PUT: RequestHandler = async ({ request }) => {
	const config = parse(await request.json().catch(() => null));
	writeConfig(config);
	return json(config);
};
