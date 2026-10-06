import { error, json } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { count as countRows, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { getWidget } from '$lib/core/registry';
import { ParamError, sanitizeParams, sanitizeRefreshRate } from '$lib/core/validate';
import { registerAllWidgets } from '$lib/widgets';
import { getDb, widgetInstances } from '$lib/server/db';
import { getOwnedRow, toInstance } from '$lib/server/dashboard';
import { requireSubscription } from '$lib/server/subscriptions';

const MAX_INSTANCES = 50;

export const POST: RequestHandler = async ({ locals, request }) => {
	registerAllWidgets();
	const userId = locals.user!.id;
	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object')
		error(400, 'Corps de requête invalide.');
	const def = getWidget(String(body.service), String(body.widget));
	if (!def)
		error(404, 'Widget inconnu.');
	requireSubscription(userId, def.service);
	let params, refreshRate;
	try {
		params = sanitizeParams(def, body.params);
		refreshRate = sanitizeRefreshRate(def, body.refreshRate);
	} catch (e) {
		if (e instanceof ParamError)
			error(400, e.message);
		throw e;
	}
	const db = getDb();
	const count =
		db.select({ n: countRows() }).from(widgetInstances).where(eq(widgetInstances.userId, userId)).get()?.n ?? 0;
	if (count >= MAX_INSTANCES)
		error(400, `Limite de ${MAX_INSTANCES} widgets atteinte.`);
	const id = randomUUID();
	db.insert(widgetInstances)
		.values({
			id,
			userId,
			service: def.service,
			widget: def.name,
			params: JSON.stringify(params),
			refreshRate,
			position: count,
			w: def.size?.w ?? 1,
			h: def.size?.h ?? 1
		})
		.run();
	return json(toInstance(getOwnedRow(userId, id)!), { status: 201 });
};
