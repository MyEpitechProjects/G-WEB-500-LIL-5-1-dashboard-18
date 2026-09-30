import { defineWidget } from '$lib/core/registry';
import TrailerLoop from './TrailerLoop.svelte';
import steamTags from './steam_tags_options.json';
import steamTagsIds from './steam_tags_ids.json';
import steamLangs from './steam_langs.json';

export interface SteamParams {
	lang: string;
	sales_only: boolean;
	max_price: number;
	rotate: number;
	[key: string]: string | number | boolean;
}

export interface SteamGame {
	appid: string;
	html: string;
}

export interface SteamData {
	games: string;
}

export const trailerLoop = defineWidget<SteamParams, SteamData>({
	service: 'steam',
	name: 'trailer_loop',
	title: 'Trailers Steam',
	description: 'Fait défiler les widgets Steam d’une liste de jeux',
	defaultRefresh: 1800,
	minRefresh: 300,
	size: { w: 2, h: 2 },
	params: [
		{
			name: 'lang',
			label: 'Widget language',
			type: 'select',
			default: 'english',
			required: true,
			help: '',
			options: Object.values(steamLangs).sort((a, b) =>
				a.label.localeCompare(b.label)
			)
		},
		{
			name: 'sales_only',
			label: 'Show only games on sales',
			type: 'boolean',
			default: false,
			required: true,
			help: ''
		},
		{
			name: 'game_tag',
			label: 'Game tags',
			type: 'multiselect',
			default: [],
			required: false,
			help: '',
			options: Object.values(steamTags).sort((a, b) =>
				a.label.localeCompare(b.label)
			)
		},
		{
			name: 'exclude_game_tag',
			label: 'Exclude Game tags',
			type: 'multiselect',
			default: ["sexual_content", "nudity", "hentai"],
			required: false,
			help: '',
			options: Object.values(steamTags).sort((a, b) =>
				a.label.localeCompare(b.label)
			)
		},
		{
			name: 'max_price',
			label: 'Max games prices',
			type: 'string',
			default: -1,
			required: true,
			help: '0 for only show free games, -1 to show all games'
		}
	],
	async load({ params, fetch, signal }) {
		const tags = params.game_tag;
		const untags = params.exclude_game_tag

		const tagIds = Array.isArray(tags)
			? tags
					.map((tag) => steamTagsIds[tag])
					.filter(Boolean)
					.join(',')
			: '';
		const untagIds = Array.isArray(untags)
			? untags
					.map((tag) => steamTagsIds[tag])
					.filter(Boolean)
					.join(',')
			: '';

		const query = new URLSearchParams({
			lang: String(params.lang),
			tags: tagIds,
			max_price: Number(params.max_price),
			sales: Number(params.sales_only),
			untags: untagIds,
		});

		const response = await fetch(`/api/steam/search?${query.toString()}`, {
			signal
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch Steam games: ${response.status}`);
		}

		const appids: number[] = await response.json();

		return {
			games: appids.map(String)
		};
	},
	component: TrailerLoop
});
