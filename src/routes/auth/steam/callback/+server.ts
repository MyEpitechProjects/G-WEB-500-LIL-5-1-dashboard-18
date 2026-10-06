import { randomUUID } from 'node:crypto';
import { redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { getDb, linkedAccounts } from '$lib/server/db';
import { subscribe } from '$lib/server/subscriptions';
import { verifyOpenId } from '$lib/server/steam';

export const GET: RequestHandler = async ({ locals, cookies, url }) => {
	if (!locals.user)
		redirect(303, '/login');
	const state = cookies.get('steam_state');
	cookies.delete('steam_state', { path: '/auth/steam' });
	if (!state)
		redirect(303, '/services?error=steam_state');
	const steamId = await verifyOpenId(url.searchParams, `${url.origin}/auth/steam/callback?state=${state}`);
	if (!steamId)
		redirect(303, '/services?error=steam_invalid');
	const db = getDb();
	const owner = db.select({ userId: linkedAccounts.userId }).from(linkedAccounts).where(and(eq(linkedAccounts.provider, 'steam'), eq(linkedAccounts.providerAccountId, steamId))).get();
	if (owner && owner.userId !== locals.user.id)
		redirect(303, '/services?error=steam_taken');
	db.transaction((tx) => {
		tx.delete(linkedAccounts)
			.where(and(eq(linkedAccounts.userId, locals.user!.id), eq(linkedAccounts.provider, 'steam')))
			.run();
		tx.insert(linkedAccounts)
			.values({ id: randomUUID(), userId: locals.user!.id, provider: 'steam', providerAccountId: steamId })
			.run();
	});
	subscribe(locals.user.id, 'steam');
	redirect(303, '/services?linked=steam');
};
