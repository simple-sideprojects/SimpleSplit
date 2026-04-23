import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { authStorage } from './storage';

/**
 * Use from inside a universal `+page.ts` / `+layout.ts` load when an SDK call
 * returns 401. Clears the client-side token (if any) and redirects to login.
 * Works on SSR too — the `authStorage` clear is a no-op on the server, but
 * the redirect still fires.
 */
export async function redirectUnauthenticated(): Promise<never> {
	if (browser) {
		await authStorage.clearToken();
	}
	redirect(302, '/auth/login');
}
