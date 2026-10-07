import { registerWidgets } from '$lib/core/registry';
import { cityTemperature } from './weather';
import { trailerLoop } from './steam/trailer';
import { ownedGamesNews } from './steam/news';
import { sncfJourneys, sncfDisruptions } from './sncf';

let registered = false;

export function registerAllWidgets(): void {
	if (registered) return;
	registerWidgets([cityTemperature, trailerLoop, ownedGamesNews, sncfJourneys, sncfDisruptions]);
	registered = true;
}
