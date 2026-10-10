import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export type Unit = 'c' | 'f';

export interface WidgetConfig {
	city: string;
	unit: Unit;
	refresh: number;
}

export const DEFAULT_CONFIG: WidgetConfig = { city: 'Paris', unit: 'c', refresh: 60 };

const path = process.env.DATABASE_PATH ?? './data/poc.db';
mkdirSync(dirname(path), { recursive: true });

const db = new Database(path);
db.pragma('journal_mode = WAL');
db.exec(`
	CREATE TABLE IF NOT EXISTS widget_config (
		id      INTEGER PRIMARY KEY CHECK (id = 1),
		city    TEXT    NOT NULL,
		unit    TEXT    NOT NULL,
		refresh INTEGER NOT NULL
	)
`);

export function readConfig(): WidgetConfig {
	const row = db
		.prepare('SELECT city, unit, refresh FROM widget_config WHERE id = 1')
		.get() as WidgetConfig | undefined;
	return row ?? DEFAULT_CONFIG;
}

export function writeConfig(config: WidgetConfig): void {
	db.prepare(
		`INSERT INTO widget_config (id, city, unit, refresh) VALUES (1, @city, @unit, @refresh)
		 ON CONFLICT(id) DO UPDATE SET city = @city, unit = @unit, refresh = @refresh`
	).run(config);
}
