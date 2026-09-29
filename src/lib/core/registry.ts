import type { AboutResponse, ParamSpec, WidgetDefinition, WidgetParams } from './types';

const widgets = new Map<string, WidgetDefinition<any, any>>();

export function widgetKey(service: string, name: string): string {
	return `${service}.${name}`;
}

/**
 * Helper typé : garde l'inférence sur les params et les données.
 * À utiliser dans chaque fichier de widget.
 */
export function defineWidget<P extends WidgetParams, D>(
	def: WidgetDefinition<P, D>
): WidgetDefinition<P, D> {
	return def;
}

export function registerWidgets(defs: WidgetDefinition<any, any>[]): void {
	for (const def of defs) {
		const key = widgetKey(def.service, def.name);
		if (widgets.has(key)) throw new Error(`Widget déjà enregistré : ${key}`);
		widgets.set(key, def);
	}
}

export function getWidget(service: string, name: string): WidgetDefinition | undefined {
	return widgets.get(widgetKey(service, name));
}

export function listWidgets(): WidgetDefinition[] {
	return [...widgets.values()];
}

export function listServices(): { name: string; widgets: WidgetDefinition[] }[] {
	const byService = new Map<string, WidgetDefinition[]>();
	for (const def of widgets.values()) {
		const list = byService.get(def.service) ?? [];
		list.push(def);
		byService.set(def.service, list);
	}
	return [...byService].map(([name, list]) => ({ name, widgets: list }));
}

/** Valeurs par défaut d'un widget, prêtes à remplir le formulaire de config. */
export function defaultParams(def: WidgetDefinition): WidgetParams {
	return Object.fromEntries(def.params.map((p) => [p.name, p.default]));
}

/** about.json n'autorise que integer et string. */
function apiType(param: ParamSpec): 'integer' | 'string' {
	return param.type === 'integer' || param.type === 'number' ? 'integer' : 'string';
}

export function buildAboutServices(): AboutResponse['server']['services'] {
	return listServices().map(({ name, widgets }) => ({
		name,
		widgets: widgets.map((w) => ({
			name: w.name,
			description: w.description,
			params: w.params.map((p) => ({ name: p.name, type: apiType(p) }))
		}))
	}));
}
