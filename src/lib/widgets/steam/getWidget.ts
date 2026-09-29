import { defineWidget } from '$lib/core/registry';
import TrailerLoop from './TrailerLoop.svelte';

export async function getWidgetHtml(
	appid: string,
): Promise<string | null> {
	const url = new URL('/api/steam/widget', location.origin);
	url.searchParams.set('appid', appid);
	const response = await fetch(url);
	if (!response.ok) {
		return null;
	}
	return await response.text()
}