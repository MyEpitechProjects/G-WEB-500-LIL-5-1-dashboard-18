import type { WidgetInstance, WidgetParams } from '$lib/core/types';
import { defaultParams, getWidget } from '$lib/core/registry';

const STORAGE_KEY = 'dashboard:instances';

/**
 * État du dashboard.
 *
 * La persistance passe par une petite couche `save()` / `load()` : aujourd'hui
 * localStorage, à remplacer par des appels API une fois l'auth en place
 * (les instances doivent être liées au compte utilisateur).
 */
class DashboardState {
	instances = $state<WidgetInstance[]>([]);

	load(): void {
		if (typeof localStorage === 'undefined') return;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			this.instances = raw ? (JSON.parse(raw) as WidgetInstance[]) : [];
		} catch {
			this.instances = [];
		}
	}

	#save(): void {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(this.instances));
	}

	add(service: string, widget: string, params?: WidgetParams, refreshRate?: number): WidgetInstance {
		const def = getWidget(service, widget);
		if (!def) throw new Error(`Widget inconnu : ${service}.${widget}`);

		const instance: WidgetInstance = {
			id: crypto.randomUUID(),
			service,
			widget,
			params: { ...defaultParams(def), ...params },
			refreshRate: Math.max(refreshRate ?? def.defaultRefresh, def.minRefresh ?? 1),
			position: this.instances.length,
			size: def.size
		};
		this.instances = [...this.instances, instance];
		this.#save();
		return instance;
	}

	update(id: string, patch: Partial<Pick<WidgetInstance, 'params' | 'refreshRate' | 'size'>>): void {
		this.instances = this.instances.map((i) => (i.id === id ? { ...i, ...patch } : i));
		this.#save();
	}

	remove(id: string): void {
		this.instances = this.instances
			.filter((i) => i.id !== id)
			.map((i, index) => ({ ...i, position: index }));
		this.#save();
	}

	/** Déplacement dans la grille : réordonne et renumérote les positions. */
	move(id: string, toIndex: number): void {
		const from = this.instances.findIndex((i) => i.id === id);
		if (from === -1 || toIndex < 0 || toIndex >= this.instances.length) return;

		const next = [...this.instances];
		const [moved] = next.splice(from, 1);
		next.splice(toIndex, 0, moved);
		this.instances = next.map((i, index) => ({ ...i, position: index }));
		this.#save();
	}
}

export const dashboard = new DashboardState();
