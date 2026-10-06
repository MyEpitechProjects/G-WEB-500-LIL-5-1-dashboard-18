import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLinkedAccount, requireSubscription } from '$lib/server/subscriptions';
import { SteamError, getLibraryNews } from '$lib/server/steam';

function intParam(url: URL, name: string, fallback: number, min: number, max: number): number {
	const n = Math.trunc(Number(url.searchParams.get(name) ?? fallback));
	return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback;
}

export const GET: RequestHandler = async ({ locals, url }) => {
	const userId = locals.user!.id;
	requireSubscription(userId, 'steam');
	const steamId = getLinkedAccount(userId, 'steam');
	if (!steamId)
		error(409, 'Aucun compte Steam lié : relancez la liaison depuis la page Services.');
	const sort = url.searchParams.get('sort') === 'playtime' ? 'playtime' : 'recent';
	try {
		const items = await getLibraryNews(steamId, {
			games: intParam(url, 'games', 8, 1, 20),
			perGame: intParam(url, 'per_game', 2, 1, 5),
			count: intParam(url, 'count', 10, 1, 30),
			maxLength: intParam(url, 'max_length', 200, 50, 1000),
			sort,
			officialOnly: url.searchParams.get('official_only') === '1'
		});
		return json(items);
	} catch (e) {
		if (e instanceof SteamError)
			error(e.status as 409 | 502 | 503, e.message);
		throw e;
	}
};
