import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

export type Db = BetterSQLite3Database<typeof schema>;

let instance: Db | null = null;

export function getDb(): Db {
	if (instance)
		return instance;
	const path = env.DATABASE_PATH || './data/dashboard.db';
	mkdirSync(dirname(path), { recursive: true });
	const sqlite = new Database(path);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	const db = drizzle(sqlite, { schema });
	migrate(db, { migrationsFolder: env.MIGRATIONS_DIR || 'drizzle' });
	instance = db;
	return db;
}

export * from './schema';
