
export async function getAppTrailer(appid: number): Promise<string | null> {
    try {
        const response = await fetch(
            `https://store.steampowered.com/api/appdetails?appids=${appid}&l=french`
        );
        if (!response.ok) {
            return null;
        }
        const json = await response.json();
        const entry = json[appid];
        if (!entry?.success) {
            return null;
        }
        const movies = entry.data?.movies;
        if (!movies || movies.length === 0) {
            return null;
        }
        const firstTrailer = movies[0];
        return firstTrailer.dash_av1 ?? firstTrailer.dash_h264 ?? firstTrailer.hls_h264 ?? null;
    } catch {
        return null;
    }
}
