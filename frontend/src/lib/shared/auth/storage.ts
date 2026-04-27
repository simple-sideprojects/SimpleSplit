import { browser } from '$app/environment';
import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'auth_token';

/**
 * Client-side token storage.
 *
 * Token *transport* is always `Authorization: Bearer <token>` to FastAPI.
 * Token *storage* differs by environment:
 *   - Capacitor / SPA / browser: `@capacitor/preferences` (on the web this
 *     falls back to `localStorage`; on native it uses the platform keystore).
 *   - SSR: the `auth_token` httpOnly cookie is authoritative; it's read in
 *     `hooks.server.ts` and attached to per-request SDK calls. This module
 *     is a no-op on the server.
 */
export const authStorage = {
	async getToken(): Promise<string | null> {
		if (!browser) return null;
		const { value } = await Preferences.get({ key: TOKEN_KEY });
		return value;
	},

	async setToken(token: string): Promise<void> {
		if (!browser) return;
		await Preferences.set({ key: TOKEN_KEY, value: token });
	},

	async clearToken(): Promise<void> {
		if (!browser) return;
		await Preferences.remove({ key: TOKEN_KEY });
	}
};
