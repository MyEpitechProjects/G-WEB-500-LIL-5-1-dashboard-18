import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { getDb, users } from '$lib/server/db';
import {
	createEmailToken,
	createSession,
	rateLimit,
	setSessionCookie,
	verifyDummyPassword,
	verifyPassword
} from '$lib/server/auth';
import { sendConfirmationEmail } from '$lib/server/mail';
import { accountNeedsVerification } from '$lib/server/config';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user)
		redirect(303, '/');
	return { 
		confirmed: url.searchParams.get('confirmed') === '1',
		registered: url.searchParams.get('registered') === '1',
		created: url.searchParams.get('created') === '1',
		email: url.searchParams.get('email')
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, url, getClientAddress }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const password = String(form.get('password') ?? '');
		if (!rateLimit(`login:${getClientAddress()}:${email}`, 10, 15 * 60 * 1000)) {
			return fail(429, { error: 'Trop de tentatives, réessayez dans quelques minutes.', email });
		}
		const user = getDb().select().from(users).where(eq(users.email, email)).get();
		if (!user) {
			await verifyDummyPassword(password);
			return fail(400, { error: 'Email ou mot de passe incorrect.', email });
		}
		if (!(await verifyPassword(password, user.passwordHash))) {
			return fail(400, { error: 'Email ou mot de passe incorrect.', email });
		}
		if (!user.emailVerifiedAt && !accountNeedsVerification()) {
			getDb().update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, user.id)).run();
		} else if (!user.emailVerifiedAt) {
			try {
				const token = createEmailToken(user.id);
				await sendConfirmationEmail(user.email, user.username, `${url.origin}/confirm?token=${token}`);
			} catch (e) {
				console.error('[mail] envoi impossible', e);
			}
			return fail(403, {
				error: 'Votre adresse email n’est pas confirmée. Un nouveau lien de confirmation vient de vous être envoyé.',
				email
			});
		}
		const { token, expiresAt } = createSession(user.id);
		setSessionCookie(cookies, token, expiresAt, url.protocol === 'https:');
		redirect(303, '/');
	}
};