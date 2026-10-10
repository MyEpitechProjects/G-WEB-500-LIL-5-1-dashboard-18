import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import {requireSubscription } from '$lib/server/subscriptions';

export const GET: RequestHandler = async ({ url, locals }) => {
	requireSubscription(locals.user!.id, 'sncf');
	const apiKey = env.SNCF_API_KEY;
	if (!apiKey) {
		return new Response(JSON.stringify({ error: 'SNCF API Key missing' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
	}

	const requested = Math.trunc(Number(url.searchParams.get('count') ?? 5));
	const count = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 10) : 5;

	const severity = url.searchParams.get('severity') ?? 'all';
	const severityEffects: Record<string, string[] | null> = {
		all: null,
		no_service: ['NO_SERVICE'],
		delays: ['SIGNIFICANT_DELAYS', 'REDUCED_SERVICE'],
		changes: ['DETOUR', 'MODIFIED_SERVICE', 'STOP_MOVED']
	};

	if (!(severity in severityEffects)) {
		return new Response(JSON.stringify({ error: 'Invalid severity' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
	}

	const effects = severityEffects[severity];

	const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();
	if (search.length > 80) {
		return new Response(JSON.stringify({ error: 'Search too long' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
	}

	const authHeader = btoa(`${apiKey}:`);

	try {
		const response = await fetch('https://api.sncf.com/v1/coverage/sncf/disruptions?count=50', {
			headers: { Authorization: `Basic ${authHeader}` },
			signal: AbortSignal.timeout(8000)
		});

		if (!response.ok) {
			return new Response(JSON.stringify({ error: 'SNCF service unavailable' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
		}

		const data = await response.json();

		const disruptions = (data.disruptions ?? [])
			.filter((d: { status?: string }) => d.status !== 'past')
			.filter((d: { severity?: { effect?: string } }) => !effects || effects.includes(d.severity?.effect ?? ''))
			.map((d: {
				id: string;
				severity?: { name?: string; color?: string; effect?: string };
				messages?: { text?: string }[];
				impacted_objects?: { pt_object?: { name?: string } }[];
			}) => ({
				id: d.id,
				severity: {
					name: d.severity?.name ?? null,
					effect: d.severity?.effect ?? null,
					color: /^[0-9a-fA-F]{6}$/.test(d.severity?.color ?? '') ? d.severity?.color : null
				},
				messages: (d.messages ?? []).slice(0, 1).map((m) => ({
					text: m.text ?? ''
				})),
				lines: (d.impacted_objects ?? [])
					.map((o) => o.pt_object?.name)
					.filter((n): n is string => Boolean(n))
					.slice(0, 5)
			}))
			.filter((d: {
				messages: { text: string }[];
				lines: string[];
			}) =>
				!search ||
				d.messages.some((m) => m.text.toLowerCase().includes(search)) ||
				d.lines.some((l) => l.toLowerCase().includes(search))
			)
			.slice(0, count);

		return new Response(JSON.stringify({ disruptions }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch {
		return new Response(JSON.stringify({ error: 'SNCF service unreachable' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
	}
};
