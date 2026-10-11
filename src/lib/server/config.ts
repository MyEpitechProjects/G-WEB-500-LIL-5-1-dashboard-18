import { env } from '$env/dynamic/private';

export function accountNeedsVerification(): boolean {
	const value = (env.ACCOUNT_NEED_VERIFICATION ?? '').trim().toLowerCase();
	return !['false', '0', 'no', 'off'].includes(value);
}
