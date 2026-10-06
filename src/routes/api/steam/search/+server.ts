import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {getGameIds} from '$lib/widgets/steam/trailer/getGamesIds';
import { requireSubscription } from '$lib/server/subscriptions';


export const GET: RequestHandler = async ({ url, locals }) => {
	requireSubscription(locals.user!.id, 'steam');
	return json(
		await getGameIds(
			url.searchParams.get('lang') ?? '',
			url.searchParams.get('tags') ?? '',
			url.searchParams.get('max_price') ?? -1,
			url.searchParams.get('sales') ?? 0,
			url.searchParams.get('untags') ?? '')
	);
};