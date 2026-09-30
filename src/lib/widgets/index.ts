import { registerWidgets } from '$lib/core/registry';
import { cityTemperature } from './weather';
import { trailerLoop } from './steam';

let registered = false;

export function registerAllWidgets(): void {
	if (registered) return;
	registerWidgets([cityTemperature, trailerLoop]);
	registered = true;
}
