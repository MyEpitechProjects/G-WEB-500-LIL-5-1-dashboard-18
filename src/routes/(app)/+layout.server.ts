import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	if (!locals.user)
		redirect(303, '/login');
	return { user: { username: locals.user.username, email: locals.user.email } };
};
