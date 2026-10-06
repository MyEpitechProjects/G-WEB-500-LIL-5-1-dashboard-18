import * as cheerio from "cheerio";

export async function getGameIds(lang: string, tags: string, maxPrice: number, sales: number, untags: string): Promise<number[]> {
    try {
        //todo untags
        const response = await fetch(
            `https://store.steampowered.com/search?hwtype=0&specials=${sales}&maxprice=${maxPrice}&untags=${untags}&supportedlang=${lang},english&tags=${tags}`
        );
        if (!response.ok) {
            return [];
        }
        const html = await response.text();
        const $ = cheerio.load(html);
        const appIds: number[] = [];
        $(".search_result_row").each((_, element) => {
            const appId = $(element).attr("data-ds-appid");

            if (appId) {
                appIds.push(Number(appId));
            }
        });
        return appIds;

    } catch {
        return [];
    }
}
