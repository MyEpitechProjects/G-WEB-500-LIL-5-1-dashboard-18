import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { getDb, widgetInstances } from '$lib/server/db';

export const PUT: RequestHandler = async ({ locals, request }) => {
	const userId = locals.user!.id;
	const body = await request.json().catch(() => null);
	const ids: unknown = body?.ids;
	if (!Array.isArray(ids) || ids.some((i) => typeof i !== 'string'))
		error(400, 'Liste invalide.');
	const db = getDb();
	db.transaction((tx: any) => {
		const owned = new Set(
			tx.select({ id: widgetInstances.id }).from(widgetInstances).where(eq(widgetInstances.userId, userId)).all().map((r: any) => r.id)
		);
		if (ids.length !== owned.size || new Set(ids).size !== ids.length || ids.some((i: unknown) => !owned.has(i))) {
			error(400, 'La liste ne correspond pas à vos widgets.');
		}
		(ids as string[]).forEach((id, position) =>
			tx.update(widgetInstances).set({ position }).where(eq(widgetInstances.id, id)).run()
		);
	});
	return new Response(null, { status: 204 });
};
