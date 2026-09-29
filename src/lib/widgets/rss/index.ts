import { defineWidget } from '$lib/core/registry';
import ArticleList from './ArticleList.svelte';

export interface RssParams {
	link: string;
	number: number;
	[key: string]: string | number | boolean;
}

export interface RssItem {
	title: string;
	link: string;
	date: string | null;
}

export interface RssData {
	title: string;
	items: RssItem[];
}

/**
 * Le flux est récupéré par notre serveur (`/api/rss`) : les flux RSS
 * n'envoient pas d'en-têtes CORS, un fetch direct depuis le navigateur échoue.
 */
export const articleList = defineWidget<RssParams, RssData>({
	service: 'rss',
	name: 'article_list',
	title: 'Derniers articles',
	description: 'Affiche les derniers articles d’un flux RSS',
	defaultRefresh: 900,
	minRefresh: 60,
	size: { w: 1, h: 2 },
	params: [
		{
			name: 'link',
			label: 'URL du flux',
			type: 'url',
			default: '',
			required: true,
			placeholder: 'https://www.lemonde.fr/rss/une.xml'
		},
		{
			name: 'number',
			label: 'Nombre d’articles',
			type: 'integer',
			default: 5,
			min: 1,
			max: 20
		}
	],
	async load({ params, fetch, signal }) {
		const url = new URL('/api/rss', location.origin);
		url.searchParams.set('link', params.link);
		url.searchParams.set('number', String(params.number));

		const response = await fetch(url, { signal });
		if (!response.ok) {
			const { message } = await response.json().catch(() => ({ message: '' }));
			throw new Error(message || 'Le flux n’a pas pu être lu.');
		}
		return response.json();
	},
	component: ArticleList
});
