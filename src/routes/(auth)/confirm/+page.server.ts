import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { confirmEmail } from '$lib/server/auth';

export const load: PageServerLoad = ({ url }) => {
	const token = url.searchParams.get('token') ?? '';
	if (token && confirmEmail(token))
		redirect(303, '/login?confirmed=1');
	return {};
};
