import type { WidgetInstance, WidgetParams } from '$lib/core/types';

async function messageOf(response: Response): Promise<string> {
	const body = await response.json().catch(() => null);
	return body?.message ?? `Erreur ${response.status}`;
}

const JSON_HEADERS = { 'content-type': 'application/json' };

class DashboardState {
	instances = $state<WidgetInstance[]>([]);
	error = $state<string | null>(null);
	init(instances: WidgetInstance[]): void {
		this.instances = instances;
		this.error = null;
	}
	async add(
		service: string,
		widget: string,
		params: WidgetParams,
		refreshRate: number
	): Promise<WidgetInstance> {
		const response = await fetch('/api/dashboard', {
			method: 'POST',
			headers: JSON_HEADERS,
			body: JSON.stringify({ service, widget, params, refreshRate })
		});
		if (!response.ok)
			throw new Error(await messageOf(response));
		const instance: WidgetInstance = await response.json();
		this.instances = [...this.instances, instance];
		return instance;
	}
	async update(id: string, patch: { params: WidgetParams; refreshRate: number }): Promise<void> {
		const response = await fetch(`/api/dashboard/${id}`, {
			method: 'PATCH',
			headers: JSON_HEADERS,
			body: JSON.stringify(patch)
		});
		if (!response.ok)
			throw new Error(await messageOf(response));
		const saved: WidgetInstance = await response.json();
		this.instances = this.instances.map((i) => (i.id === id ? saved : i));
	}

	async remove(id: string): Promise<void> {
		const before = this.instances;
		this.instances = before
			.filter((i) => i.id !== id)
			.map((i, position) => (i.position === position ? i : { ...i, position }));
		await this.#sync(before, () => fetch(`/api/dashboard/${id}`, { method: 'DELETE' }));
	}

	async move(id: string, toIndex: number): Promise<void> {
		const from = this.instances.findIndex((i) => i.id === id);
		if (from === -1 || toIndex < 0 || toIndex >= this.instances.length || from === toIndex)
			return;
		const before = this.instances;
		const next = [...before];
		const [moved] = next.splice(from, 1);
		next.splice(toIndex, 0, moved);
		this.instances = next.map((i, position) => (i.position === position ? i : { ...i, position }));
		await this.#sync(before, () =>
			fetch('/api/dashboard/order', {
				method: 'PUT',
				headers: JSON_HEADERS,
				body: JSON.stringify({ ids: next.map((i) => i.id) })
			})
		);
	}

	async #sync(rollback: WidgetInstance[], request: () => Promise<Response>): Promise<void> {
		try {
			const response = await request();
			if (!response.ok)
				throw new Error(await messageOf(response));
			this.error = null;
		} catch (e) {
			this.instances = rollback;
			this.error = e instanceof Error ? e.message : 'Action impossible.';
		}
	}
}

export const dashboard = new DashboardState();