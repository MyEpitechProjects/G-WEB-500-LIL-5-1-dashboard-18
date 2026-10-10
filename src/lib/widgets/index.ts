import { registerWidgets } from '$lib/core/registry';
import { cityTemperature } from './weather';
import { cityForecast } from './weather/forecast';
import { trailerLoop } from './steam/trailer';
import { ownedGamesNews } from './steam/news';
import { sncfJourneys, sncfDisruptions } from './sncf';

let registered = false;

export function registerAllWidgets(): void {
	if (registered)
		return;
	registerWidgets([cityTemperature, cityForecast, trailerLoop, ownedGamesNews, sncfJourneys, sncfDisruptions]);
	registered = true;
}