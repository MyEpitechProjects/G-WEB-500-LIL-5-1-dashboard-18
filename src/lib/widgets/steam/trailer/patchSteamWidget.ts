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

export function patchSteamWidgetHtml(
	originalHtml: string,
	mpdUrl: string
): string {
        const $ = cheerio.load(originalHtml);
	$("head").append(CUSTOM_CSS);
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
