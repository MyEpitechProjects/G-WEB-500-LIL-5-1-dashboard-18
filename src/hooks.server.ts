import { json, type Handle } from '@sveltejs/kit';
import { SESSION_COOKIE, validateSession } from '$lib/server/auth';


export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE);
	event.locals.user = token ? validateSession(token) : null;
	if (event.url.pathname.startsWith('/api/') && !event.locals.user) {
		return json({ message: 'Authentification requise.' }, { status: 401 });
	}
	const response = await resolve(event);
	response.headers.set('x-content-type-options', 'nosniff');
	response.headers.set('x-frame-options', 'DENY');
	response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
	return response;
};
