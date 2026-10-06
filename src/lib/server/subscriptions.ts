import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { SERVICES, getService } from '$lib/core/services';
import { getDb, linkedAccounts, subscriptions, widgetInstances } from './db';

/** Services accessibles : ceux par défaut + les abonnements explicites. */
export function getSubscribedServices(userId: string): string[] {
	const rows = getDb().select({ service: subscriptions.service }).from(subscriptions).where(eq(subscriptions.userId, userId)).all();
	const explicit = rows.map((r) => r.service);
	const defaults = SERVICES.filter((s) => s.defaultSubscribed).map((s) => s.name);
	return [...new Set([...defaults, ...explicit])];
}

export function isSubscribed(userId: string, service: string): boolean {
	return getSubscribedServices(userId).includes(service);
}

export function requireSubscription(userId: string, service: string): void {
	if (!isSubscribed(userId, service)) {
		error(403, `Abonnez-vous au service « ${getService(service)?.label ?? service} » pour l’utiliser.`);
	}
}

export function subscribe(userId: string, service: string): void {
	getDb().insert(subscriptions).values({ userId, service }).onConflictDoNothing().run();
}

export function unsubscribe(userId: string, service: string): void {
	const meta = getService(service);
	const db = getDb();
	db.transaction((tx) => {
		tx.delete(subscriptions).where(and(eq(subscriptions.userId, userId), eq(subscriptions.service, service))).run();
		if (meta?.provider) {
			tx.delete(linkedAccounts).where(and(eq(linkedAccounts.userId, userId), eq(linkedAccounts.provider, meta.provider))).run();
		}
		tx.delete(widgetInstances).where(and(eq(widgetInstances.userId, userId), eq(widgetInstances.service, service))).run();
	});
}

export function getLinkedAccount(userId: string, provider: string): string | null {
	const row = getDb().select({ id: linkedAccounts.providerAccountId }).from(linkedAccounts).where(and(eq(linkedAccounts.userId, userId), eq(linkedAccounts.provider, provider))).get();
	return row?.id ?? null;
}
