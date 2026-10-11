import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { getDb, users } from '$lib/server/db';
import {
	createEmailToken,
	hashPassword,
	newUserId,
	rateLimit,
	validateRegistration
} from '$lib/server/auth';
import { sendConfirmationEmail } from '$lib/server/mail';
import { accountNeedsVerification } from '$lib/server/config';

type FormErrors = { email?: string; username?: string; password?: string; form?: string };
const NO_VALUES = { email: '', username: '' };

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ request, url, getClientAddress }) => {
		if (!rateLimit(`register:${getClientAddress()}`, 10, 60 * 60 * 1000)) {
			return fail(429, {
				errors: { form: 'Trop de tentatives, réessayez plus tard.' } as FormErrors,
				values: NO_VALUES
			});
		}
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const username = String(form.get('username') ?? '').trim();
		const password = String(form.get('password') ?? '');
		const values = { email, username };
		const errors = validateRegistration({ email, username, password });
		if (Object.keys(errors).length > 0)
			return fail(400, { errors: errors as FormErrors, values });
		const db = getDb();
		const existing = db.select({ id: users.id }).from(users).where(eq(users.email, email)).get();
		if (existing)
			return fail(400, { errors: { email: 'Un compte existe déjà avec cet email.' } as FormErrors, values });
		const id = newUserId();
		const needsVerification = accountNeedsVerification();
		db.insert(users)
			.values({
				id,
				email,
				username,
				passwordHash: await hashPassword(password),
				emailVerifiedAt: needsVerification ? null : new Date()
			})
			.run();
		if (!needsVerification)
			redirect(303, `/login?created=1&email=${encodeURIComponent(email)}`);
		const token = createEmailToken(id);
		try {
			await sendConfirmationEmail(email, username, `${url.origin}/confirm?token=${token}`);
		} catch (e) {
			console.error('[mail] envoi impossible', e);
			return fail(500, {
				errors: {
					form: 'Compte créé, mais l’email de confirmation n’a pas pu être envoyé. Essayez de vous connecter pour en recevoir un nouveau.'
				} as FormErrors,
				values
			});
		}
		redirect(303, `/login?registered=1&email=${encodeURIComponent(email)}`);
	}
};