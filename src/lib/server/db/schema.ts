import { integer, primaryKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

const now = () => new Date();

export const users = sqliteTable('users', {
	id: text('id').primaryKey(),

	// lowercase
	email: text('email').notNull().unique(),
	username: text('username').notNull(),
	passwordHash: text('password_hash').notNull(),

	// null until confirm
	emailVerifiedAt: integer('email_verified_at', { mode: 'timestamp_ms' }),
	createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(now)
});

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull()
});

export const emailTokens = sqliteTable('email_tokens', {
	tokenHash: text('token_hash').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull()
});

export const subscriptions = sqliteTable(
	'subscriptions',
	{
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		service: text('service').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(now)
	},
	(t) => [primaryKey({ columns: [t.userId, t.service] })]
);

export const linkedAccounts = sqliteTable(
	'linked_accounts',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		provider: text('provider').notNull(),
		providerAccountId: text('provider_account_id').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(now)
	},
	(t) => [
		unique('linked_accounts_user_provider').on(t.userId, t.provider),
		unique('linked_accounts_provider_account').on(t.provider, t.providerAccountId)
	]
);

export const widgetInstances = sqliteTable('widget_instances', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	service: text('service').notNull(),
	widget: text('widget').notNull(),

	params: text('params').notNull(),
	refreshRate: integer('refresh_rate').notNull(),
	position: integer('position').notNull(),
	w: integer('w').notNull().default(1),
	h: integer('h').notNull().default(1),
	createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(now)
});
