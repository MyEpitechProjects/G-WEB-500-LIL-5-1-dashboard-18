import { registerWidgets } from '$lib/core/registry';
import { cityTemperature } from './weather';
import { articleList } from './rss';
import { trailerLoop } from './steam';

/**
 * Seul endroit à modifier pour ajouter un widget au projet.
 * Importé par le layout (client) et par /about.json (serveur), donc le
 * catalogue exposé à la correction et celui affiché dans l'UI ne peuvent pas
 * diverger.
 */
let registered = false;

export function registerAllWidgets(): void {
	if (registered) return;
	registerWidgets([cityTemperature, articleList, trailerLoop]);
	registered = true;
}
