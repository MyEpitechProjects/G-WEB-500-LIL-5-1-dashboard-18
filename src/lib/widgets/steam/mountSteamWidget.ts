// src/lib/widgets/steam/mountSteamWidget.ts
//
// Monte le fragment HTML renvoyé par /api/steam/widget dans un <div> via
// Shadow DOM, à la place d'un iframe :
// - Shadow DOM isole le CSS du widget (#widget, .desc, ...) du reste de la
//   page, comme le ferait un iframe, mais sans les contraintes de mise à
//   l'échelle d'un iframe : le contenu reste dans le flux normal du DOM et
//   ne peut pas dépasser le conteneur si celui-ci a overflow: hidden ;
// - un innerHTML n'exécute jamais les <script> qu'il contient, donc dash.js
//   est chargé et initialisé ici, en JS, avec un accès direct à la <video> ;
// - le clic sur « suivant » est un vrai addEventListener sur l'élément du
//   Shadow DOM : plus besoin du pont postMessage utilisé avec l'iframe.

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

/** Charge dash.js une seule fois pour toute la page, quel que soit le nombre d'instances du widget. */
function loadDashJs(): Promise<void> {
	if (window.dashjs) return Promise.resolve();
	if (dashJsReady) return dashJsReady;

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
	/** appelé quand l'utilisateur clique le bouton « suivant » injecté dans le widget */
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
		if (!video || !mpdUrl) return;

		try {
			await loadDashJs();
			if (shadow.contains(video) && window.dashjs) {
				player = window.dashjs.MediaPlayer().create();
				player.initialize(video, mpdUrl, true);
			}
		} catch {
			// pas de lecteur vidéo dispo : le poster de la capsule reste affiché
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
