import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildAboutServices } from '$lib/core/registry';
import { registerAllWidgets } from '$lib/widgets';
import type { AboutResponse } from '$lib/core/types';


export const GET: RequestHandler = ({ getClientAddress }) => {
	registerAllWidgets();
	const body: AboutResponse = {
		client: { host: getClientAddress() },
		server: {
			current_time: Math.floor(Date.now() / 1000),
			services: buildAboutServices()
		}
	};

	return json(body);
};
