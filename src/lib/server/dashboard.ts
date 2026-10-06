import { and, asc, eq } from 'drizzle-orm';
import type { WidgetInstance, WidgetParams } from '$lib/core/types';
import { getDb, widgetInstances } from './db';

type Row = typeof widgetInstances.$inferSelect;

function parseParams(raw: string): WidgetParams {
	try {
		const value = JSON.parse(raw);
		return value && typeof value === 'object' ? value : {};
	} catch {
		return {};
	}
}

export function toInstance(row: Row): WidgetInstance {
	return {
		id: row.id,
		service: row.service,
		widget: row.widget,
		params: parseParams(row.params),
		refreshRate: row.refreshRate,
		position: row.position,
		size: { w: row.w, h: row.h }
	};
}

export function listInstances(userId: string): WidgetInstance[] {
	return getDb().select().from(widgetInstances).where(eq(widgetInstances.userId, userId)).orderBy(asc(widgetInstances.position)).all().map(toInstance);
}

export function getOwnedRow(userId: string, id: string): Row | undefined {
	return getDb().select().from(widgetInstances).where(and(eq(widgetInstances.id, id), eq(widgetInstances.userId, userId))).get();
}
