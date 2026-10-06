import { randomBytes } from 'node:crypto';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildLoginUrl } from '$lib/server/steam';

export const GET: RequestHandler = ({ locals, cookies, url }) => {
	if (!locals.user)
		redirect(303, '/login');
	const state = randomBytes(16).toString('hex');
	cookies.set('steam_state', state, {
		path: '/auth/steam',
		httpOnly: true,
		sameSite: 'lax',
		secure: url.protocol === 'https:',
		maxAge: 600
	});
	const returnTo = `${url.origin}/auth/steam/callback?state=${state}`;
	redirect(303, buildLoginUrl(url.origin, returnTo));
};
