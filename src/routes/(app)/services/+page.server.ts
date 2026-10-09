import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { SERVICES, getService } from '$lib/core/services';
import { registerAllWidgets } from '$lib/widgets';
import { listServices } from '$lib/core/registry';
import {
	getLinkedAccount,
	getSubscribedServices,
	subscribe,
	unsubscribe
} from '$lib/server/subscriptions';

const ERRORS: Record<string, string> = {
	steam_state: 'La liaison Steam a expiré, recommencez.',
	steam_invalid: 'Steam n’a pas pu confirmer votre identité, recommencez.',
	steam_taken: 'Ce compte Steam est déjà lié à un autre utilisateur.'
};

export const load: PageServerLoad = ({ locals, url }) => {
	if (!locals.user) redirect(303, '/login');
	registerAllWidgets();
	const subscribed = new Set(getSubscribedServices(locals.user.id));
	const widgetCount = new Map(listServices().map((s) => [s.name, s.widgets.length]));

	return {
		services: SERVICES.map((s) => ({
			...s,
			subscribed: subscribed.has(s.name),
			widgets: widgetCount.get(s.name) ?? 0,
			linked: s.provider ? getLinkedAccount(locals.user.id, s.provider) !== null : false
		})),
		notice: url.searchParams.get('linked') ? 'Compte Steam lié, service activé.' : null,
		error: ERRORS[url.searchParams.get('error') ?? ''] ?? null
	};
};

export const actions: Actions = {
	subscribe: async ({ locals, request }) => {
		const name = String((await request.formData()).get('service') ?? '');
		const service = getService(name);
		if (!service)
			return fail(400, { error: 'Service inconnu.' });
		if (service.provider === 'steam')
			redirect(303, '/auth/steam');
		if (!locals.user) redirect(303, '/login');
		subscribe(locals.user.id, service.name);
		return { notice: `Abonné au service ${service.label}.` };
	},

	unsubscribe: async ({ locals, request }) => {
		const name = String((await request.formData()).get('service') ?? '');
		const service = getService(name);
		if (!service)
			return fail(400, { error: 'Service inconnu.' });
		if (service.defaultSubscribed)
			return fail(400, { error: 'Ce service est inclus d’office.' });
		if (!locals.user) redirect(303, '/login');
		unsubscribe(locals.user.id, service.name);
		return { notice: `Désabonné du service ${service.label}.` };
	}
};
