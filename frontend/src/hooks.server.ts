import { dev } from '$app/environment';
import { client } from '$lib/client/client.gen';
import { i18n } from '$lib/i18n';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

const handleParaglide: Handle = i18n.handle();

export const handleAuth: Handle = ({ event, resolve }) => {
	const token = event.cookies.get('auth_token');

	if (token) {
		client.interceptors.request.use((request) => {
			request.headers.set('Authorization', `Bearer ${token}`);
			return request;
		});
	} else if (!event.route.id?.includes('auth')) {
		throw redirect(303, '/auth/login');
	}

	return resolve(event);
};

export const handle = sequence(handleParaglide, handleAuth);

if (dev) {
	const { server } = await import('./mocks/server');

	server.listen({
		onUnhandledRequest(request, print) {
			if (!request.url.includes('mocked')) {
				return;
			}

			print.warning();
		}
	});
}
