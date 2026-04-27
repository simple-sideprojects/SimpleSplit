import { building, dev } from '$app/environment';
import { PUBLIC_BACKEND_URL } from '$env/static/public';
import { createServerApiClient } from '$lib/server/api';
import { i18n } from '$lib/i18n';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { csrf } from './lib/server/hooks/csrf';

const handleParaglide: Handle = i18n.handle();

const PUBLIC_PATH_PREFIXES = ['/auth', '/welcome', '/offline', '/api/auth'];

/**
 * Reads the cookie-borne token into `event.locals`, publishes a per-request
 * SDK client, and wraps `event.fetch` so universal loaders whose SDK calls
 * go to `PUBLIC_BACKEND_URL` automatically carry the Bearer header on SSR.
 */
const handleAuth: Handle = ({ event, resolve }) => {
	if (building) {
		return resolve(event);
	}

	const token = event.cookies.get('auth_token') ?? null;
	event.locals.token = token;

	if (token) {
		const originalFetch = event.fetch;
		event.fetch = (input, init) => {
			const url =
				typeof input === 'string'
					? input
					: input instanceof URL
						? input.toString()
						: input.url;

			if (url.startsWith(PUBLIC_BACKEND_URL)) {
				const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
				if (!headers.has('Authorization')) {
					headers.set('Authorization', `Bearer ${token}`);
				}
				return originalFetch(input, { ...init, headers });
			}

			return originalFetch(input, init);
		};
	}

	event.locals.api = createServerApiClient({ fetch: event.fetch, token });

	const routeId = event.route.id ?? '';
	const isPublic = PUBLIC_PATH_PREFIXES.some((prefix) => event.url.pathname.startsWith(prefix));

	if (token && event.url.pathname.startsWith('/auth') && !event.url.pathname.startsWith('/auth/confirm')) {
		redirect(303, '/');
	}

	if (!token && !isPublic && routeId) {
		redirect(303, '/auth/login');
	}

	return resolve(event);
};

const allowedOrigins = ['http://localhost:3000', 'http://localhost:4173', 'http://localhost:5173'];

export const handle = sequence(csrf([], allowedOrigins), handleParaglide, handleAuth);

if (dev) {
	const { server } = await import('./mocks/server');

	server.listen();
}
