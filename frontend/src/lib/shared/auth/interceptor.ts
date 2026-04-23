import { client } from '$lib/client/client.gen';
import { authStorage } from './storage';

let installed = false;

/**
 * Install a request interceptor on the shared browser SDK client that injects
 * `Authorization: Bearer <token>` from `authStorage` on every outgoing call.
 *
 * Safe to call repeatedly; only the first call registers the interceptor.
 * Must NOT run on SSR — on the server we build a per-request SDK client
 * instead (see `event.locals.api` in `hooks.server.ts`).
 */
export function installAuthInterceptor(): void {
	if (installed) return;
	installed = true;

	client.interceptors.request.use(async (request) => {
		const token = await authStorage.getToken();
		if (token) {
			request.headers.set('Authorization', `Bearer ${token}`);
		}
		return request;
	});
}
