import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import {requireSubscription } from '$lib/server/subscriptions';

export const GET: RequestHandler = async ({ url, locals }) => {
	requireSubscription(locals.user!.id, 'sncf');
	const apiKey = env.SNCF_API_KEY;
	if (!apiKey) {
		return new Response(JSON.stringify({ error: 'SNCF API Key missing' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
	}

	const from = (url.searchParams.get('from') ?? '').trim();
	const to = (url.searchParams.get('to') ?? '').trim();

	if (!from || !to) {
		return new Response(JSON.stringify({ error: 'Missing from or to parameters' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
	}

	if (from.length > 80 || to.length > 80) {
		return new Response(JSON.stringify({ error: 'Station name too long' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
	}

	const requested = Math.trunc(Number(url.searchParams.get('count') ?? 4));
	const count = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 6) : 4;

	const authHeader = btoa(`${apiKey}:`);
	const headers = { Authorization: `Basic ${authHeader}` };

	try {
		const [fromRes, toRes] = await Promise.all([
			fetch(`https://api.sncf.com/v1/coverage/sncf/places?q=${encodeURIComponent(from)}&type[]=stop_area`, {
				headers,
				signal: AbortSignal.timeout(8000)
			}),
			fetch(`https://api.sncf.com/v1/coverage/sncf/places?q=${encodeURIComponent(to)}&type[]=stop_area`, {
				headers,
				signal: AbortSignal.timeout(8000)
			})
		]);
		if (!fromRes.ok || !toRes.ok) {
			return new Response(JSON.stringify({ error: 'SNCF service unavailable' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
		}

		const fromData = await fromRes.json();
		const toData = await toRes.json();
		const fromId = fromData.places?.find(
			(place: any) =>
				place.stop_area?.administrative_regions?.some(
					(region: any) => region.level === 8 && region.name === from
				)
		)?.id;

		const toId = toData.places?.find(
			(place: any) =>
				place.stop_area?.administrative_regions?.some(
					(region: any) => region.level === 8 && region.name === to
				)
		)?.id;

		console.log(fromId);
		console.log(toId);
		if (!fromId || !toId) {
			return new Response(JSON.stringify({ error: 'Gare non trouvée' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
		}
		if (fromId == toId) {
			return new Response(JSON.stringify({ error: 'Erreur lors de la récupération des gares' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
		}

		const journeysRes = await fetch(
			`https://api.sncf.com/v1/coverage/sncf/journeys?from=${encodeURIComponent(fromId)}&to=${encodeURIComponent(toId)}&datetime_represents=departure&count=${count}`,
			{
				headers,
				signal: AbortSignal.timeout(8000)
			}
		);
		if (!journeysRes.ok) {
				const body = await journeysRes.text();

		console.log('SNCF API error:', {
			status: journeysRes.status,
			body
		});
			return new Response(JSON.stringify({ error: 'SNCF service unavailable' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
		}
		const journeysData = await journeysRes.json();

		const journeys = (journeysData.journeys ?? []).slice(0, count).map((journey: {
			departure_date_time: string;
			arrival_date_time: string;
			duration: number;
			nb_transfers?: number;
		}) => ({
			departure_date_time: journey.departure_date_time,
			arrival_date_time: journey.arrival_date_time,
			duration: journey.duration,
			nb_transfers: journey.nb_transfers ?? 0
		}));

		return new Response(JSON.stringify({ journeys }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch {
		return new Response(JSON.stringify({ error: 'SNCF service unreachable' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
	}
};
