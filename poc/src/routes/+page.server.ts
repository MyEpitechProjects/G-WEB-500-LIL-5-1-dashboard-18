import type { PageServerLoad } from './$types';
import { readConfig } from '$lib/server/db';

export const load: PageServerLoad = () => ({ config: readConfig() });
