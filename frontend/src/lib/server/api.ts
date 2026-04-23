import { PUBLIC_BACKEND_URL } from '$env/static/public';
import { createClient, createConfig } from '@hey-api/client-fetch';
import type { ClientOptions } from '$lib/client/types.gen';

export type ApiClient = ReturnType<typeof createServerApiClient>;

/**
 * Build a fresh SDK client bound to this request's `fetch` (so SvelteKit can
 * trace the SSR call) and the request's token (read from the httpOnly cookie
 * into `event.locals.token`).
 *
 * Never mutate a shared module-scoped client with `interceptors.request.use`
 * on the server — that leaks tokens across concurrent requests.
 */
export function createServerApiClient(opts: { fetch: typeof fetch; token?: string | null }) {
	const api = createClient(
		createConfig<ClientOptions>({
			baseUrl: PUBLIC_BACKEND_URL,
			fetch: opts.fetch
		})
	);

	if (opts.token) {
		api.interceptors.request.use((request) => {
			request.headers.set('Authorization', `Bearer ${opts.token}`);
			return request;
		});
	}

	return api;
}
