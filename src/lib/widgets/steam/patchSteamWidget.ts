// src/lib/server/patchSteamWidget.ts
//
// Patch le HTML brut du widget Steam officiel (récupéré via
// https://store.steampowered.com/widget/<appid>/) pour y injecter
// un lecteur vidéo (trailer DASH) à la place de la capsule statique,
// avec le style custom déjà défini côté widget_custom_v2.
//
// npm i cheerio

import * as cheerio from "cheerio";

const VIDEO_ID = "steamVideoPlayer";

const CUSTOM_CSS = `
<style>
video::-webkit-media-controls-playback-rate-button {
    display: none;
}

#widget {
    height: auto !important;
    min-height: auto !important;
    padding-bottom: 60px !important;
    position: relative !important;
    box-sizing: border-box !important;
    transform-origin: top left !important;
}

#widget .desc {
    margin: 10px 15px !important;
    font-size: 13px !important;
    color: #c9c9c9 !important;
    line-height: 18px !important;
    max-height: none !important;
    height: auto !important;
    overflow: visible !important;
    display: block !important;
    -webkit-line-clamp: unset !important;
    -webkit-box-orient: unset !important;
    float: none !important;
    width: auto !important;
}

#widget .desc a {
    display: block !important;
    width: 100% !important;
    margin-bottom: 12px !important;
}

#widget .desc video {
    width: 100% !important;
    height: auto !important;
    max-height: auto !important;
    display: block !important;
    object-fit: cover !important;
    border-radius: 2px !important;
}

#widget .game_purchase_action {
    position: absolute !important;
    bottom: 10px !important;
    right: 15px !important;
    margin: 0 !important;
}

#widget .game_area_purchase_platform {
    position: absolute !important;
    bottom: 12px !important;
    left: 15px !important;
}

#widget .game_purchase_action_bg {
    background: transparent !important;
    display: flex !important;
    align-items: center !important;
}

#widget .discount_block {
    background-color: #000 !important;
    padding: 2px 0 2px 2px !important;
    border-radius: 2px 0 0 2px !important;
    margin: 0 !important;
}

#widget .btn_addtocart {
    background-color: #000 !important;
    padding: 2px 2px 2px 0 !important;
    border-radius: 0 2px 2px 0 !important;
    margin: 0 !important;
}

#widget .next_in_queue_area {
    width: 125px !important;
    margin-left: 12px !important;
    float: none !important;
}

#widget .btn_next_in_queue {
    width: 90px !important;
    margin: 0 !important;
    height: 96% !important;
}

#widget .next_in_queue_content {
    padding: 0 20px 0 10px !important;
}

#widget .btn_next_in_queue:after {
    border-width: 15.5px !important;
}
</style>
`.trim();

/**
 * Patch le HTML d'un widget Steam officiel pour remplacer la capsule
 * statique par un lecteur vidéo DASH pointant vers le trailer fourni.
 *
 * @param originalHtml HTML brut tel que renvoyé par store.steampowered.com/widget/<appid>/
 * @param mpdUrl        URL du manifeste DASH (.mpd) du trailer à jouer
 * @returns              fragment HTML (style + contenu), à monter en Shadow DOM
 */
export function patchSteamWidgetHtml(
	originalHtml: string,
	mpdUrl: string
): string {
	const $ = cheerio.load(originalHtml);

	// 1. Injecte le CSS custom en fin de <head>
	$("head").append(CUSTOM_CSS);

	// 2. Récupère la capsule existante pour garder le poster + l'ancre cliquable
    $("a:has(img.capsule)").attr("draggable", "false");
	const capsuleImg = $(".desc img.capsule");
	const posterAttr = capsuleImg.attr("src")
		? ` poster="${capsuleImg.attr("src")}"`
		: "";

	const safeMpdUrl = mpdUrl.replace(/"/g, "&quot;");
	const videoTag =
		`<video id="${VIDEO_ID}" data-mpd-url="${safeMpdUrl}" autoplay muted loop playsinline controls ` +
		`controlslist="nofullscreen nodownload noremoteplayback" ` +
		`disablepictureinpicture${posterAttr}></video>`;

	if (capsuleImg.length > 0) {
		capsuleImg.replaceWith(videoTag);
	} else {
		// Widget sans capsule (ex: jeu non sorti) -> on insère en tête du .desc
		$(".desc").prepend(videoTag);
	}

	const purchaseAction = $(".game_purchase_action_bg");

const nextButton = `
<div id="nextInDiscoveryQueue" class="next_in_queue_area">
	<div
		data-panel="{&quot;noFocusRing&quot;:true,&quot;focusable&quot;:true,&quot;clickOnActivate&quot;:true}"
		role="button"
		class="btn_next_in_queue btn_next_in_queue_trigger"
		data-tooltip-text="Continuer vers le produit suivant."
	>
		<div class="next_in_queue_content">
			<span>Suivant<br></span>
		</div>
	</div>
</div>
`;

	purchaseAction.append(nextButton);

	// 4. On ne renvoie que les styles du <head> + le contenu du <body> :
	// c'est un fragment pensé pour être posé dans un Shadow DOM. Steam charge
	// l'essentiel de son CSS via des <link rel="stylesheet"> (pas des <style>
	// inline) : il faut les récupérer aussi, sinon il ne reste que nos
	// règles !important sans aucune base Steam pour s'appuyer dessus, d'où
	// le rendu "HTML brut" (gros titres soulignés, aucune mise en page).
	// Les href relatifs (ex: /public/css/...) doivent être résolus en
	// absolu : un Shadow DOM posé sur notre propre page n'a pas la même
	// base URL que store.steampowered.com.
	const stylesheetLinks = $("head link[rel='stylesheet']")
		.toArray()
		.map((el) => {
			const href = $(el).attr("href");
			if (href) $(el).attr("href", new URL(href, "https://store.steampowered.com").href);
			return $.html(el);
		})
		.join("\n");
	const inlineStyles = $("head style").toArray().map((el) => $.html(el)).join("\n");
	const body = $("body").html() ?? "";

	return `${stylesheetLinks}\n${inlineStyles}\n${body}`;
}
