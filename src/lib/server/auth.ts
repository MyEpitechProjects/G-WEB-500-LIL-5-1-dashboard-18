import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { Cookies } from '@sveltejs/kit';
import { and, eq, gt, lt } from 'drizzle-orm';
import { emailTokens, getDb, sessions, users } from './db';

const scryptAsync = promisify(scrypt) as (
	password: string,
	salt: Buffer,
	keylen: number
) => Promise<Buffer>;

export const SESSION_COOKIE = 'session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export interface SessionUser {
	id: string;
	email: string;
	username: string;
}

export function sha256(value: string): string {
	return createHash('sha256').update(value).digest('hex');
}

function newToken(): string {
	return randomBytes(32).toString('base64url');
}

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16);
	const key = await scryptAsync(password, salt, 64);
	return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const [scheme, saltHex, keyHex] = stored.split('$');
	if (scheme !== 'scrypt' || !saltHex || !keyHex)
		return false;
	const expected = Buffer.from(keyHex, 'hex');
	const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length);
	return timingSafeEqual(actual, expected);
}

// faux hash executé si email incorrect, pour ne pas leak d'email
const DUMMY_HASH = `scrypt$${'00'.repeat(16)}$${'00'.repeat(64)}`;
export async function verifyDummyPassword(password: string): Promise<void> {
	await verifyPassword(password, DUMMY_HASH);
}




export function createSession(userId: string): { token: string; expiresAt: Date } {
	const token = newToken();
	const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
	getDb().insert(sessions).values({ id: sha256(token), userId, expiresAt }).run();
	return { token, expiresAt };
}

export function validateSession(token: string): SessionUser | null {
	const db = getDb();
	const id = sha256(token);
	const row = db.select({ session: sessions, user: users }).from(sessions).innerJoin(users, eq(sessions.userId, users.id)).where(eq(sessions.id, id)).get();
	if (!row)
		return null;
	if (row.session.expiresAt.getTime() <= Date.now() || !row.user.emailVerifiedAt) {
		db.delete(sessions).where(eq(sessions.id, id)).run();
		return null;
	}
	if (row.session.expiresAt.getTime() - Date.now() < SESSION_TTL_MS / 2) {
		db.update(sessions).set({ expiresAt: new Date(Date.now() + SESSION_TTL_MS) }).where(eq(sessions.id, id)).run();
	}
	return { id: row.user.id, email: row.user.email, username: row.user.username };
}

export function deleteSession(token: string): void {
	getDb().delete(sessions).where(eq(sessions.id, sha256(token))).run();
}

export function setSessionCookie(cookies: Cookies, token: string, expires: Date, secure: boolean): void {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure,
		expires
	});
}


export function createEmailToken(userId: string): string {
	const db = getDb();
	db.delete(emailTokens).where(and(eq(emailTokens.userId, userId), lt(emailTokens.expiresAt, new Date()))).run();
	const token = newToken();
	db.insert(emailTokens).values({
			tokenHash: sha256(token),
			userId,
			expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS)
		}).run();
	return token;
}


export function confirmEmail(token: string): boolean {
	const db = getDb();
	const row = db.select().from(emailTokens).where(and(eq(emailTokens.tokenHash, sha256(token)), gt(emailTokens.expiresAt, new Date()))).get();
	if (!row)
		return false;
	db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, row.userId)).run();
	return true;
}

export function newUserId(): string {
	return randomUUID();
}


const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateRegistration(input: {
	email: string;
	username: string;
	password: string;
}): Record<string, string> {
	const errors: Record<string, string> = {};
	if (input.email.length > 254 || !EMAIL_RE.test(input.email))
		errors.email = 'Invalid email.';
	if (input.username.length < 2 || input.username.length > 32) {
		errors.username = 'The name must contain between 2 and 32 characters.';
	}
	if (input.password.length < 8 || input.password.length > 128) {
		errors.password = 'The password must be between 8 and 128 characters long.';
	}
	return errors;
}

const attempts = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
	const now = Date.now();
	const recent = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);
	if (recent.length >= max) {
		attempts.set(key, recent);
		return false;
	}
	recent.push(now);
	attempts.set(key, recent);
	if (attempts.size > 5000) {
		for (const [k, times] of attempts) {
			if (times.every((t) => now - t >= windowMs)) attempts.delete(k);
		}
	}
	return true;
}
