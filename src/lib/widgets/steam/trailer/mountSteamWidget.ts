
interface DashJsPlayer {
	initialize(el: HTMLVideoElement, url: string, autoplay: boolean): void;
	reset(): void;
}

declare global {
	interface Window {
		dashjs?: { MediaPlayer(): { create(): DashJsPlayer } };
	}
}

const DASH_JS_SRC = 'https://cdn.dashjs.org/latest/dash.all.min.js';
let dashJsReady: Promise<void> | null = null;

function loadDashJs(): Promise<void> {
	if (window.dashjs)
		return Promise.resolve();
	if (dashJsReady)
		return dashJsReady;
	dashJsReady = new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.src = DASH_JS_SRC;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('dash.js n’a pas pu être chargé.'));
		document.head.appendChild(script);
	});
	return dashJsReady;
}

export interface MountSteamWidgetParams {
	html: string;
	onNext: () => void;
}

export function mountSteamWidget(node: HTMLDivElement, params: MountSteamWidgetParams) {
	const shadow = node.shadowRoot ?? node.attachShadow({ mode: 'open' });
	let player: DashJsPlayer | null = null;
	let unbindNext: (() => void) | null = null;

	function cleanup(): void {
		unbindNext?.();
		unbindNext = null;
		player?.reset();
		player = null;
	}

	async function render({ html, onNext }: MountSteamWidgetParams): Promise<void> {
		cleanup();
		shadow.innerHTML = html;
		const nextButton = shadow.querySelector<HTMLElement>('.btn_next_in_queue_trigger');
		if (nextButton) {
			nextButton.addEventListener('click', onNext);
			unbindNext = () => nextButton.removeEventListener('click', onNext);
		}
		const video = shadow.querySelector<HTMLVideoElement>('video[data-mpd-url]');
		const mpdUrl = video?.dataset.mpdUrl;
		if (!video || !mpdUrl)
			return;
		try {
			await loadDashJs();
			if (shadow.contains(video) && window.dashjs) {
				player = window.dashjs.MediaPlayer().create();
				player.initialize(video, mpdUrl, true);
			}
		} catch {
		}
	}
	void render(params);
	return {
		update(next: MountSteamWidgetParams) {
			void render(next);
		},
		destroy() {
			cleanup();
			shadow.innerHTML = '';
		}
	};
}
