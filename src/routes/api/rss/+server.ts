import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Lit un flux RSS/Atom côté serveur et renvoie du JSON.
 * Parsing volontairement minimal : à remplacer par `fast-xml-parser` si les
 * flux visés utilisent des extensions (media:, content:encoded, ...).
 */
function pick(block: string, tag: string): string | null {
	const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
	if (!match) return null;
	return match[1]
		.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
		.replace(/<[^>]+>/g, '')
		.trim();
}

export const GET: RequestHandler = async ({ url, fetch }) => {
	const link = url.searchParams.get('link');
	const number = Math.min(Number(url.searchParams.get('number') ?? 5), 20);

	if (!link) error(400, 'Paramètre « link » manquant.');

	let target: URL;
	try {
		target = new URL(link);
	} catch {
		error(400, 'URL de flux invalide.');
	}
	if (!['http:', 'https:'].includes(target.protocol)) error(400, 'Protocole non supporté.');

	const response = await fetch(target, { headers: { accept: 'application/rss+xml, application/xml, text/xml' } });
	if (!response.ok) error(502, 'Le flux ne répond pas.');

	const xml = await response.text();
	const blocks = xml.match(/<(item|entry)[\s\S]*?<\/\1>/gi) ?? [];

	const items = blocks.slice(0, number).map((block) => ({
		title: pick(block, 'title') ?? 'Sans titre',
		link: pick(block, 'link') ?? block.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? target.href,
		date: pick(block, 'pubDate') ?? pick(block, 'updated')
	}));

	return json({ title: pick(xml, 'title') ?? target.hostname, items });
};
