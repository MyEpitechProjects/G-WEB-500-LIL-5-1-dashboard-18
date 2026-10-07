import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const apiKey = env.SNCF_API_KEY;
	if (!apiKey || apiKey === 'votre_cle_api_sncf_ici') {
		return new Response(JSON.stringify({ error: 'SNCF API Key missing' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
	}

	const from = url.searchParams.get('from');
	const to = url.searchParams.get('to');

	if (!from || !to) {
		return new Response(JSON.stringify({ error: 'Missing from or to parameters' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
	}

	const authHeader = btoa(`${apiKey}:`);
	const headers = { Authorization: `Basic ${authHeader}` };

	try {
		// 1. Resolve 'from' place
		const fromRes = await fetch(`https://api.sncf.com/v1/coverage/sncf/places?q=${encodeURIComponent(from)}`, { headers });
		const fromData = await fromRes.json();
		const fromId = fromData.places?.[0]?.id;

		// 2. Resolve 'to' place
		const toRes = await fetch(`https://api.sncf.com/v1/coverage/sncf/places?q=${encodeURIComponent(to)}`, { headers });
		const toData = await toRes.json();
		const toId = toData.places?.[0]?.id;

		if (!fromId || !toId) {
			return new Response(JSON.stringify({ error: 'Gare non trouvée' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
		}

		// 3. Search journeys
		const journeysRes = await fetch(`https://api.sncf.com/v1/coverage/sncf/journeys?from=${fromId}&to=${toId}&datetime_represents=departure`, { headers });
		const journeysData = await journeysRes.json();

		return new Response(JSON.stringify(journeysData), { headers: { 'Content-Type': 'application/json' } });
	} catch (error: any) {
		return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
	}
};
