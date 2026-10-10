import { defineWidget } from '$lib/core/registry';
import Journeys from './Journeys.svelte';
import Disruptions from './Disruptions.svelte';


export interface JourneysParams {
	from: string;
	to: string;
	count: number;
	[key: string]: string | number | boolean;
}

export interface DisruptionsParams {
	count: number;
	severity: string;
	search: string;
	[key: string]: string | number | boolean;
}

async function readError(response: Response): Promise<Error> {
	const body = await response.json().catch(() => null);
	const message = typeof body?.error === 'string' ? body.error : `HTTP ${response.status}`;
	return new Error(`SNCF API Error: ${message}`);
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
		},
		{
			name: 'count',
			label: 'Nombre de trajets',
			type: 'integer',
			default: 4,
			required: true,
			min: 1,
			max: 6,
			help: 'Entre 1 et 6 trajets affichés.'
		}
	],
	async load({ params, fetch, signal }) {
		const url = new URL('/api/sncf/journeys', window.location.origin);
		url.searchParams.set('from', params.from);
		url.searchParams.set('to', params.to);
		url.searchParams.set('count', String(params.count));

		const response = await fetch(url.toString(), { signal });
		if (!response.ok) throw await readError(response);

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
	params: [
		{
			name: 'count',
			label: 'Nombre de perturbations',
			type: 'integer',
			default: 5,
			required: true,
			min: 1,
			max: 10,
			help: 'Entre 1 et 10 perturbations affichées.'
		},
		{
			name: 'severity',
			label: 'Gravité',
			type: 'select',
			default: 'all',
			required: true,
			options: [
				{ value: 'all', label: 'Toutes' },
				{ value: 'no_service', label: 'Circulation interrompue' },
				{ value: 'delays', label: 'Retards et service réduit' },
				{ value: 'changes', label: 'Déviations et modifications' }
			]
		},
		{
			name: 'search',
			label: 'Filtre (ligne, gare, mot-clé)',
			type: 'string',
			default: '',
			required: false,
			placeholder: 'Ex: TER Hauts-de-France',
			help: 'Laissez vide pour tout afficher.'
		}
	],
	async load({ params, fetch, signal }) {
		const url = new URL('/api/sncf/disruptions', window.location.origin);
		url.searchParams.set('count', String(params.count));
		url.searchParams.set('severity', String(params.severity ?? 'all'));
		url.searchParams.set('search', String(params.search ?? ''));

		const response = await fetch(url.toString(), { signal });
		if (!response.ok) throw await readError(response);

		return await response.json();
	},
	component: Disruptions
});