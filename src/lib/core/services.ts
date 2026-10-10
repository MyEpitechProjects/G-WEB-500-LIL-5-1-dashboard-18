export interface ServiceMeta {
	name: string;
	label: string;
	description: string;
	defaultSubscribed: boolean;
	provider?: 'steam';
}

export const SERVICES: ServiceMeta[] = [
	{
		name: 'weather',
		label: 'Météo',
		description: 'Conditions météo et prévisions d’une ville.',
		defaultSubscribed: false
	},
	{
		name: 'steam',
		label: 'Steam',
		description:
			'Trailers de jeux et actualités de votre bibliothèque. Nécessite de lier votre compte Steam.',
		defaultSubscribed: false,
		provider: 'steam'
	},
	{
		name: 'sncf',
		label: 'SNCF',
		description: 'Recherche de trajets et informations sur les perturbations du réseau SNCF.',
		defaultSubscribed: false
	}
];

export function getService(name: string): ServiceMeta | undefined {
	return SERVICES.find((s) => s.name === name);
}
