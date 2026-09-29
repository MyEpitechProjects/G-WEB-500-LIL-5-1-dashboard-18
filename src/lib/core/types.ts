import type { Component } from 'svelte';

/**
 * Types de paramètres exposés à l'utilisateur.
 * `about.json` n'accepte que "integer" et "string" : la conversion est faite
 * par `apiType()` (voir registry.ts), les autres types restent internes.
 */
export type ParamType = 'string' | 'integer' | 'number' | 'boolean' | 'select' | 'url' | 'multiselect';

export interface ParamSpec {
	/** identifiant technique, utilisé comme clé dans la config et dans about.json */
	name: string;
	/** libellé affiché dans le formulaire de configuration */
	label: string;
	type: ParamType;
	default: string | number | boolean | string[];
	required?: boolean;
	placeholder?: string;
	help?: string;
	/** pour type 'integer' | 'number' */
	min?: number;
	max?: number;
	step?: number;
	/** pour type 'select' */
	options?: { value: string; label: string }[];
}

export type WidgetParams = Record<string, string | number | boolean | string[]>;

export interface LoadContext<P extends WidgetParams = WidgetParams> {
	params: P;
	/** fetch de SvelteKit ou global, déjà lié à la requête */
	fetch: typeof globalThis.fetch;
	/** annulé si l'instance est supprimée ou si un refresh plus récent démarre */
	signal: AbortSignal;
	/** instance id, utile pour du cache côté serveur */
	instanceId: string;
}

/**
 * Tout ce qui définit un type de widget. Ajouter un widget au projet
 * = créer un fichier qui exporte un WidgetDefinition et l'enregistrer.
 */
export interface WidgetDefinition<P extends WidgetParams = WidgetParams, D = unknown> {
	/** nom du service auquel appartient le widget (weather, steam, rss, ...) */
	service: string;
	/** identifiant du widget, unique dans le service (snake_case) */
	name: string;
	/** titre lisible affiché dans l'UI */
	title: string;
	description: string;
	params: ParamSpec[];
	/** intervalle de rafraîchissement par défaut, en secondes */
	defaultRefresh: number;
	/** garde-fou pour éviter de marteler une API externe */
	minRefresh?: number;
	/** taille initiale dans la grille, en cellules */
	size?: { w: number; h: number };
	/** récupère les données affichées. Appelé par le Timer. */
	load(ctx: LoadContext<P>): Promise<D>;
	/** composant de rendu, reçoit les props WidgetRenderProps */
	component: Component<WidgetRenderProps<P, D>>;
}

export interface WidgetRenderProps<P extends WidgetParams = WidgetParams, D = unknown> {
	data: D;
	params: P;
	/** force un rechargement immédiat (bouton dans le widget, interaction...) */
	refresh: () => void;
}

/** Un widget posé sur le dashboard, avec sa configuration propre. */
export interface WidgetInstance {
	id: string;
	service: string;
	widget: string;
	params: WidgetParams;
	/** en secondes */
	refreshRate: number;
	/** ordre dans la grille */
	position: number;
	size?: { w: number; h: number };
}

export type WidgetStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Format attendu par le sujet pour GET /about.json */
export interface AboutResponse {
	client: { host: string };
	server: {
		current_time: number;
		services: {
			name: string;
			widgets: {
				name: string;
				description: string;
				params: { name: string; type: 'integer' | 'string' }[];
			}[];
		}[];
	};
}
