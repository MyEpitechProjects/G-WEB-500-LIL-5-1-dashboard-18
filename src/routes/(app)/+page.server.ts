import type { PageServerLoad } from './$types';
import { listInstances } from '$lib/server/dashboard';
import { getSubscribedServices } from '$lib/server/subscriptions';

export const load: PageServerLoad = ({ locals }) => ({
	instances: listInstances(locals.user!.id),
	subscribed: getSubscribedServices(locals.user!.id)
});
