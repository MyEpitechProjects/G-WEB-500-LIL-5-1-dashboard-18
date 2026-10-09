import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { listInstances } from '$lib/server/dashboard';
import { getSubscribedServices } from '$lib/server/subscriptions';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	return {
		instances: listInstances(locals.user.id),
		subscribed: getSubscribedServices(locals.user.id)
	};
};
