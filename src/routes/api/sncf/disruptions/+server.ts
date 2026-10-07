import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const apiKey = env.SNCF_API_KEY;
	if (!apiKey || apiKey === 'votre_cle_api_sncf_ici') {
		return new Response(JSON.stringify({ error: 'SNCF API Key missing' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
	}

	const authHeader = btoa(`${apiKey}:`);
	
	try {
		const response = await fetch('https://api.sncf.com/v1/coverage/sncf/disruptions', {
			headers: { Authorization: `Basic ${authHeader}` }
		});
		const data = await response.json();

		return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
	} catch (error: any) {
		return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
	}
};
