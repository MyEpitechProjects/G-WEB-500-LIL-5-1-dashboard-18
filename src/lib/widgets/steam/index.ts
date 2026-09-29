import { defineWidget } from '$lib/core/registry';
import TrailerLoop from './TrailerLoop.svelte';

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

/**
 * Le widget officiel Steam ne peut pas être embarqué tel quel (X-Frame-Options).
 * `/api/steam/widget` le télécharge côté serveur, le patche, et renvoie le HTML
 * brut que l'on injecte ici via `srcdoc`.
 */
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
			type: 'string',
			default: 'english',
			required: true,
			help: ''
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
			required: true,
			help: '',
			options: [
				{ value: 'action', label: 'Action' },
				{ value: 'adventure', label: 'Adventure' },
				{ value: 'rpg', label: 'RPG' },
				{ value: 'strategy', label: 'Strategy' },
				{ value: 'indie', label: 'Indie' }
			]
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
		const appids = ["2161700", "1687950", "1158850", "2187220", "2401970", "787480",
		"798460", "589360", "2993780", "2799860", "2450450"];
		
		/*
		const appids = params.appids
			.split(',')
			.map((id) => id.trim())
			.filter(Boolean);

		const games = await Promise.all(
			appids.map(async (appid) => {
				const url = new URL('/api/steam/widget', location.origin);
				url.searchParams.set('appid', appid);
				const response = await fetch(url, { signal });
				if (!response.ok) throw new Error(`Widget Steam indisponible pour l’appid ${appid}.`);
				const { html } = await response.json();
				return { appid, html };
			})
		);*/

		return { games: appids };
	},
	component: TrailerLoop
});
