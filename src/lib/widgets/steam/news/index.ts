import { defineWidget } from '$lib/core/registry';
import OwnedGamesNews from './OwnedGamesNews.svelte';

export interface OwnedGamesNewsParams {
	count: number;
	games: number;
	per_game: number;
	max_length: number;
	sort: string;
	official_only: boolean;
	[key: string]: string | number | boolean;
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

export const ownedGamesNews = defineWidget<OwnedGamesNewsParams, NewsItem[]>({
	service: 'steam',
	name: 'owned_games_news',
	title: 'Actualités de mes jeux',
	description: 'Dernières actualités des jeux de votre bibliothèque Steam',
	defaultRefresh: 900,
	minRefresh: 60,
	size: { w: 2, h: 2 },
	params: [
		{
			name: 'count',
			label: 'Number of news shown',
			type: 'integer',
			default: 5,
			min: 1,
			max: 30,
			required: true
		},
		{
			name: 'games',
			label: 'Number of different games',
			type: 'integer',
			default: 8,
			min: 1,
			max: 20,
			required: true,
			help: ''
		},
		{
			name: 'per_game',
			label: 'News per games',
			type: 'integer',
			default: 2,
			min: 1,
			max: 5
		},
		{
			name: 'sort',
			label: 'Game Choices',
			type: 'select',
			default: 'recent',
			options: [
				{ value: 'recent', label: 'Joués récemment' },
				{ value: 'playtime', label: 'Les plus joués' }
			]
		},
		{
			name: 'official_only',
			label: 'Dev News Only',
			type: 'boolean',
			default: true
		},
		{
			name: 'max_length',
			label: 'News desc max lenght',
			type: 'integer',
			default: 200,
			min: 50,
			max: 1000
		}
	],
	async load({ params, fetch, signal }) {
		const query = new URLSearchParams({
			count: String(params.count),
			games: String(params.games),
			per_game: String(params.per_game),
			max_length: String(params.max_length),
			sort: String(params.sort),
			official_only: params.official_only ? '1' : '0'
		});
		const response = await fetch(`/api/steam/news?${query}`, { signal });
		if (!response.ok) {
			const body = await response.json().catch(() => null);
			throw new Error(body?.message ?? `Actualités Steam indisponibles (${response.status}).`);
		}
		return response.json();
	},
	component: OwnedGamesNews
});
