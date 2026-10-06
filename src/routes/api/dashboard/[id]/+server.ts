import { error, json } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { getWidget } from '$lib/core/registry';
import { ParamError, sanitizeParams, sanitizeRefreshRate } from '$lib/core/validate';
import { registerAllWidgets } from '$lib/widgets';
import { getDb, widgetInstances } from '$lib/server/db';
import { getOwnedRow, toInstance } from '$lib/server/dashboard';
import { requireSubscription } from '$lib/server/subscriptions';

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	registerAllWidgets();
	const userId = locals.user!.id;
	const row = getOwnedRow(userId, params.id);
	if (!row)
		error(404, 'Widget introuvable.');
	const def = getWidget(row.service, row.widget);
	if (!def)
		error(404, 'Ce widget n’existe plus.');
	requireSubscription(userId, def.service);
	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object')
		error(400, 'Corps de requête invalide.');
	try {
		const next = {
			params: JSON.stringify(sanitizeParams(def, body.params ?? JSON.parse(row.params))),
			refreshRate: sanitizeRefreshRate(def, body.refreshRate ?? row.refreshRate)
		};
		getDb().update(widgetInstances).set(next).where(and(eq(widgetInstances.id, row.id), eq(widgetInstances.userId, userId))).run();
	} catch (e) {
		if (e instanceof ParamError)
			error(400, e.message);
		throw e;
	}

	return json(toInstance(getOwnedRow(userId, row.id)!));
};

export const DELETE: RequestHandler = ({ locals, params }) => {
	const userId = locals.user!.id;
	if (!getOwnedRow(userId, params.id))
		error(404, 'Widget introuvable.');
	const db = getDb();
	db.transaction((tx) => {
		tx.delete(widgetInstances)
			.where(and(eq(widgetInstances.id, params.id), eq(widgetInstances.userId, userId)))
			.run();
		const rest = tx.select({ id: widgetInstances.id }).from(widgetInstances).where(eq(widgetInstances.userId, userId)).orderBy(asc(widgetInstances.position)).all();
		rest.forEach((r, position) =>
			tx.update(widgetInstances).set({ position }).where(eq(widgetInstances.id, r.id)).run()
		);
	});
	return new Response(null, { status: 204 });
};
