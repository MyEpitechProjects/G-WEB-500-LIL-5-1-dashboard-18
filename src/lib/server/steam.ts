import { env } from '$env/dynamic/private';


const OPENID_URL = () => env.STEAM_OPENID_URL || 'https://steamcommunity.com/openid/login';
const API_BASE = () => env.STEAM_API_BASE || 'https://api.steampowered.com';
const STEAMID_RE = /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/;
const TIMEOUT_MS = 8000;

// openid 2.0

export function buildLoginUrl(origin: string, returnTo: string): string {
	const url = new URL(OPENID_URL());
	url.searchParams.set('openid.ns', 'http://specs.openid.net/auth/2.0');
	url.searchParams.set('openid.mode', 'checkid_setup');
	url.searchParams.set('openid.return_to', returnTo);
	url.searchParams.set('openid.realm', origin);
	url.searchParams.set('openid.identity', 'http://specs.openid.net/auth/2.0/identifier_select');
	url.searchParams.set('openid.claimed_id', 'http://specs.openid.net/auth/2.0/identifier_select');
	return url.toString();
}

export async function verifyOpenId(
	params: URLSearchParams,
	expectedReturnTo: string
): Promise<string | null> {
	if (params.get('openid.mode') !== 'id_res')
		return null;
	if (params.get('openid.return_to') !== expectedReturnTo)
		return null;
	if (params.get('openid.op_endpoint') !== OPENID_URL())
		return null;
	const claimed = params.get('openid.claimed_id') ?? '';
	const match = STEAMID_RE.exec(claimed);
	if (!match || params.get('openid.identity') !== claimed)
		return null;
	const body = new URLSearchParams();
	for (const [key, value] of params) {
		if (key.startsWith('openid.')) body.set(key, value);
	}
	body.set('openid.mode', 'check_authentication');
	try {
		const response = await fetch(OPENID_URL(), {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body,
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
		if (!response.ok)
			return null;
		const text = await response.text();
		return /^is_valid\s*:\s*true\s*$/m.test(text) ? match[1] : null;
	} catch {
		return null;
	}
}

export class SteamError extends Error {
	constructor(
		message: string,
		readonly status: number
	) {
		super(message);
	}
}

export interface OwnedGame {
	appid: number;
	name: string;
	playtimeForever: number;
	lastPlayed: number;
	iconUrl: string | null;
}

export interface NewsItem {
	id: string;
	appid: number;
	game: string;
	icon: string | null;
	title: string;
	url: string;
	author: string;
	feed: string;
	official: boolean;
	date: number;
	excerpt: string;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const ownedCache = new Map<string, { games: OwnedGame[]; expires: number }>();
const newsCache = new Map<string, { items: RawNews[]; expires: number }>();

interface RawNews {
	gid: string;
	title: string;
	url: string;
	author: string;
	contents: string;
	feedlabel: string;
	feed_type?: number;
	date: number;
}

async function getJson(url: URL): Promise<any> {
	let response: Response;
	try {
		response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
	} catch {
		throw new SteamError('Steam is not responding. Please try again later.', 502);
	}
	if (response.status === 401 || response.status === 403) {
		throw new SteamError('Steam API key rejected by Steam.', 503);
	}
	if (!response.ok) throw new SteamError(`Steam responded ${response.status}.`, 502);
	return response.json();
}

export async function getOwnedGames(steamId: string): Promise<OwnedGame[]> {
	const cached = ownedCache.get(steamId);
	if (cached && cached.expires > Date.now())
		return cached.games;
	const key = env.STEAM_API_KEY;
	if (!key)
		throw new SteamError('The server does not have a Steam API key (STEAM_API_KEY).', 503);
	const url = new URL('/IPlayerService/GetOwnedGames/v1/', API_BASE());
	url.searchParams.set('key', key);
	url.searchParams.set('steamid', steamId);
	url.searchParams.set('include_appinfo', 'true');
	url.searchParams.set('include_played_free_games', 'true');
	url.searchParams.set('format', 'json');
	const data = await getJson(url);
	const raw: any[] | undefined = data?.response?.games;
	if (!raw) {
		throw new SteamError(
			'Library not found: Make the “game details” on your Steam profile public.',
			409
		);
	}
	const games: OwnedGame[] = raw.map((g) => ({
		appid: Number(g.appid),
		name: String(g.name ?? `App ${g.appid}`),
		playtimeForever: Number(g.playtime_forever ?? 0),
		lastPlayed: Number(g.rtime_last_played ?? 0),
		iconUrl: g.img_icon_url
			? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg`
			: null
	}));
	ownedCache.set(steamId, { games, expires: Date.now() + CACHE_TTL_MS });
	return games;
}

async function getNewsForApp(appid: number, count: number, maxLength: number): Promise<RawNews[]> {
	const cacheKey = `${appid}:${count}:${maxLength}`;
	const cached = newsCache.get(cacheKey);
	if (cached && cached.expires > Date.now())
		return cached.items;
	const url = new URL('/ISteamNews/GetNewsForApp/v2/', API_BASE());
	url.searchParams.set('appid', String(appid));
	url.searchParams.set('count', String(count));
	url.searchParams.set('maxlength', String(maxLength));
	url.searchParams.set('format', 'json');
	const data = await getJson(url);
	const items: RawNews[] = data?.appnews?.newsitems ?? [];
	newsCache.set(cacheKey, { items, expires: Date.now() + CACHE_TTL_MS });
	return items;
}

export function cleanNewsText(text: string): string {
	return text
		.replace(/<[^>]*>/g, ' ')
		.replace(/\[\/?[a-z0-9*]+(?:=[^\]]*)?\]/gi, ' ')
		.replace(/\{STEAM_CLAN_(?:LOC_)?IMAGE\}\S*/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/\s+/g, ' ')
		.trim();
}

function safeUrl(value: string): string {
	try {
		const url = new URL(value);
		return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
	} catch {
		return '';
	}
}

export interface NewsOptions {
	games: number;
	perGame: number;
	count: number;
	maxLength: number;
	sort: 'recent' | 'playtime';
	officialOnly: boolean;
}

export async function getLibraryNews(steamId: string, options: NewsOptions): Promise<NewsItem[]> {
	const library = await getOwnedGames(steamId);
	const ranked = [...library].sort((a, b) =>
		options.sort === 'playtime' ? b.playtimeForever - a.playtimeForever : b.lastPlayed - a.lastPlayed || b.playtimeForever - a.playtimeForever
	);
	const selected = ranked.slice(0, options.games);
	const perGame = await Promise.all(
		selected.map(async (game) => {
			try {
				const raw = await getNewsForApp(game.appid, options.officialOnly ? 20 : options.perGame, options.maxLength);
				return raw
					.filter((n) => !options.officialOnly || n.feed_type === 1)
					.slice(0, options.perGame)
					.map<NewsItem>((n) => ({
						id: `${game.appid}-${n.gid}`,
						appid: game.appid,
						game: game.name,
						icon: game.iconUrl,
						title: cleanNewsText(String(n.title ?? '')),
						url: safeUrl(String(n.url ?? '')),
						author: cleanNewsText(String(n.author ?? '')),
						feed: cleanNewsText(String(n.feedlabel ?? '')),
						official: n.feed_type === 1,
						date: Number(n.date ?? 0),
						excerpt: cleanNewsText(String(n.contents ?? ''))
					}));
			} catch {
				return [];
			}
		})
	);
	return perGame
		.flat()
		.sort((a, b) => b.date - a.date)
		.slice(0, options.count);
}
