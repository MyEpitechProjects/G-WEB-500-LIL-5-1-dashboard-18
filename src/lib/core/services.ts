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
		description: 'Conditions météo actuelles d’une ville. Aucun compte externe requis.',
		defaultSubscribed: true
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
		defaultSubscribed: true
	}
];

export function getService(name: string): ServiceMeta | undefined {
	return SERVICES.find((s) => s.name === name);
}
