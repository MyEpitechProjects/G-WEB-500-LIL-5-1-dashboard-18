/**
 * Timer : un seul intervalle pour tout le dashboard.
 *
 * Chaque instance de widget s'enregistre avec sa période. Le Timer tick toutes
 * les secondes, exécute les tâches échues, et met en pause quand l'onglet n'est
 * pas visible (les tâches en retard repartent au retour).
 *
 * Un seul setInterval plutôt qu'un par widget : pas de dérive entre widgets,
 * un seul point d'arrêt, et on évite N timers qui réveillent le thread.
 */

export interface TimerTask {
	/** période en millisecondes */
	intervalMs: number;
	/** exécuté à chaque échéance. Les erreurs sont gérées par l'appelant. */
	run: () => void | Promise<void>;
}

interface Entry extends TimerTask {
	nextRun: number;
	running: boolean;
}

const TICK_MS = 1000;

class Timer {
	#tasks = new Map<string, Entry>();
	#handle: ReturnType<typeof setInterval> | null = null;
	#paused = false;

	/** Enregistre une tâche. Retourne la fonction de désinscription. */
	register(id: string, task: TimerTask): () => void {
		this.#tasks.set(id, { ...task, nextRun: Date.now(), running: false });
		this.#start();
		return () => this.unregister(id);
	}

	/** Change la période sans perdre la tâche (reconfiguration du refresh rate). */
	setInterval(id: string, intervalMs: number): void {
		const entry = this.#tasks.get(id);
		if (!entry) return;
		entry.intervalMs = intervalMs;
		entry.nextRun = Date.now() + intervalMs;
	}

	unregister(id: string): void {
		this.#tasks.delete(id);
		if (this.#tasks.size === 0) this.#stop();
	}

	/** Force l'exécution immédiate (bouton « Actualiser »). */
	runNow(id: string): void {
		const entry = this.#tasks.get(id);
		if (entry) void this.#execute(id, entry);
	}

	#start(): void {
		if (this.#handle !== null || typeof window === 'undefined') return;
		this.#handle = setInterval(() => this.#tick(), TICK_MS);
		document.addEventListener('visibilitychange', this.#onVisibility);
	}

	#stop(): void {
		if (this.#handle === null) return;
		clearInterval(this.#handle);
		this.#handle = null;
		document.removeEventListener('visibilitychange', this.#onVisibility);
	}

	#onVisibility = (): void => {
		this.#paused = document.hidden;
		if (!this.#paused) this.#tick();
	};

	#tick(): void {
		if (this.#paused) return;
		const now = Date.now();
		for (const [id, entry] of this.#tasks) {
			if (entry.running || entry.nextRun > now) continue;
			void this.#execute(id, entry);
		}
	}

	async #execute(id: string, entry: Entry): Promise<void> {
		entry.running = true;
		try {
			await entry.run();
		} finally {
			entry.running = false;
			entry.nextRun = Date.now() + entry.intervalMs;
			// la tâche a pu être retirée pendant l'exécution
			if (!this.#tasks.has(id)) return;
		}
	}
}

export const timer = new Timer();
