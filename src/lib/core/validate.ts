import type { ParamSpec, WidgetDefinition, WidgetParams } from './types';

export class ParamError extends Error {}

const MAX_STRING = 500;
const MAX_MULTISELECT = 100;
const MAX_REFRESH_SECONDS = 24 * 60 * 60;

function coerce(spec: ParamSpec, value: unknown): string | number | boolean | string[] {
	switch (spec.type) {
		case 'boolean':
			return value === true || value === 'true';

		case 'integer':
		case 'number': {
			const n = Number(value);
			if (!Number.isFinite(n))
				throw new ParamError(`« ${spec.label} » doit être un nombre.`);
			let result = spec.type === 'integer' ? Math.trunc(n) : n;
			if (spec.min !== undefined)
				result = Math.max(result, spec.min);
			if (spec.max !== undefined)
				result = Math.min(result, spec.max);
			return result;
		}
		case 'select': {
			const str = String(value);
			if (spec.options && !spec.options.some((o) => o.value === str)) {
				throw new ParamError(`« ${spec.label} » : valeur non autorisée.`);
			}
			return str;
		}
		case 'multiselect': {
			if (!Array.isArray(value)) throw new ParamError(`« ${spec.label} » doit être une liste.`);
			const allowed = spec.options ? new Set(spec.options.map((o) => o.value)) : null;
			const items = [...new Set(value.map(String))].slice(0, MAX_MULTISELECT);
			if (allowed && items.some((i) => !allowed.has(i))) {
				throw new ParamError(`« ${spec.label} » : valeur non autorisée.`);
			}
			return items;
		}
		default: {
			if (typeof value !== 'string' && typeof value !== 'number') {
				throw new ParamError(`« ${spec.label} » doit être un texte.`);
			}
			const str = String(value).trim();
			if (str.length > MAX_STRING)
				throw new ParamError(`« ${spec.label} » est trop long.`);
			if (spec.required && str === '')
				throw new ParamError(`« ${spec.label} » est requis.`);
			if (spec.type === 'url' && str !== '') {
				let parsed: URL;
				try {
					parsed = new URL(str);
				} catch {
					throw new ParamError(`« ${spec.label} » : URL invalide.`);
				}
				if (!['http:', 'https:'].includes(parsed.protocol)) {
					throw new ParamError(`« ${spec.label} » : seules les URL http(s) sont acceptées.`);
				}
			}
			return str;
		}
	}
}

export function sanitizeParams(def: WidgetDefinition, raw: unknown): WidgetParams {
	const input =
		raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
	const out: WidgetParams = {};
	for (const spec of def.params) {
		out[spec.name] = coerce(spec, input[spec.name] ?? spec.default);
	}
	return out;
}

export function sanitizeRefreshRate(def: WidgetDefinition, raw: unknown): number {
	const n = Number(raw ?? def.defaultRefresh);
	if (!Number.isFinite(n))
		throw new ParamError('Le taux de rafraîchissement doit être un nombre.');
	return Math.min(Math.max(Math.trunc(n), def.minRefresh ?? 1), MAX_REFRESH_SECONDS);
}
