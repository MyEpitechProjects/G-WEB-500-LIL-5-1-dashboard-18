import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {getGameIds} from '$lib/widgets/steam/getGamesIds';


export const GET: RequestHandler = async ({ url }) => {
	const queryTags = url.searchParams.get('tags');
	const queryLang = url.searchParams.get('lang');
	const queryMaxPrice = url.searchParams.get('max_price');
	const querySales = url.searchParams.get('sales');
	const queryUntags = url.searchParams.get('untags');


	const tags = queryTags ?? '';
	const lang = queryLang ?? '';
	const maxPrice = queryMaxPrice ?? -1;
	const sales = querySales ?? 0;
	const untags = queryUntags ?? '';


	const appIds = await getGameIds(lang, tags, maxPrice, sales, untags);

	return json(appIds);
};