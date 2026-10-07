import { defineWidget } from '$lib/core/registry';
import Journeys from './Journeys.svelte';
import Disruptions from './Disruptions.svelte';

export interface JourneysParams {
	from: string;
	to: string;
	[key: string]: string | number | boolean;
}

export interface DisruptionsParams {
	[key: string]: string | number | boolean;
}

export const sncfJourneys = defineWidget<JourneysParams, any>({
	service: 'sncf',
	name: 'journeys',
	title: 'Prochains départs',
	description: 'Affiche les prochains trains entre deux gares.',
	defaultRefresh: 300, // refresh every 5 mins
	minRefresh: 60,
	size: { w: 2, h: 2 },
	params: [
		{
			name: 'from',
			label: 'Gare de départ',
			type: 'string',
			default: 'Paris',
			required: true,
			placeholder: 'Ex: Lille Flandres'
		},
		{
			name: 'to',
			label: 'Gare d\'arrivée',
			type: 'string',
			default: 'Lyon',
			required: true,
			placeholder: 'Ex: Bordeaux St-Jean'
		}
	],
	async load({ params, fetch, signal }) {
		const url = new URL('/api/sncf/journeys', window.location.origin);
		url.searchParams.set('from', params.from);
		url.searchParams.set('to', params.to);

		const response = await fetch(url.toString(), { signal });
		
		if (!response.ok) {
			const text = await response.text();
			throw new Error(`SNCF API Error: ${text}`);
		}

		return await response.json();
	},
	component: Journeys
});

export const sncfDisruptions = defineWidget<DisruptionsParams, any>({
	service: 'sncf',
	name: 'disruptions',
	title: 'Perturbations Trafic',
	description: 'Affiche les dernières perturbations signalées par la SNCF.',
	defaultRefresh: 600, // refresh every 10 mins
	minRefresh: 120,
	size: { w: 2, h: 2 },
	params: [],
	async load({ fetch, signal }) {
		const response = await fetch('/api/sncf/disruptions', { signal });
		
		if (!response.ok) {
			const text = await response.text();
			throw new Error(`SNCF API Error: ${text}`);
		}

		return await response.json();
	},
	component: Disruptions
});
