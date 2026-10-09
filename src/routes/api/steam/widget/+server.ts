import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {getAppTrailer} from '$lib/widgets/steam/trailer/getTrailer';
import {patchSteamWidgetHtml} from '$lib/widgets/steam/trailer/patchSteamWidget';
import { requireSubscription } from '$lib/server/subscriptions';




const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { html: string; expires: number }>();


export const GET: RequestHandler = async ({ url, fetch, locals }) => {
	requireSubscription(locals.user!.id, 'steam');
	const appid = url.searchParams.get('appid');
	if (!appid || !/^\d+$/.test(appid))
		error(400, 'Appid invalide.');
	const cached = cache.get(appid);
	if (cached && cached.expires > Date.now())
		return new Response(cached.html, {
			headers: { 'content-type': 'text/html' }
		});
	const trailer = await getAppTrailer(Number(appid));
	if (!trailer){
		return error(404, `NO_TRAILER`);;
	}
	const response = await fetch(`https://store.steampowered.com/widget/${appid}/`);
	if (!response.ok)
		error(404, `NO_WIDGET`);
	const html = patchSteamWidgetHtml(await response.text(), trailer);
	cache.set(appid, { html, expires: Date.now() + CACHE_TTL_MS });
	return new Response(html, {
		headers: { 'content-type': 'text/html' }
	});
};
