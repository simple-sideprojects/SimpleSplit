import { dev } from '$app/environment';
import { client } from '$lib/client/client.gen';
import { i18n } from '$lib/i18n';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { csrf } from './hooks/csrf';

const handleParaglide: Handle = i18n.handle();

export const handleAuth: Handle = ({ event, resolve }) => {
	if(building){
		return resolve(event);
	}
	const token = event.cookies.get('auth_token');
	if (token) {
		client.interceptors.request.use((request) => {
			request.headers.set('Authorization', `Bearer ${token}`);
			return request;
		});
		if(event.route.id?.includes('auth')){
			throw redirect(303, '/');
		}
	} else if (!event.route.id?.includes('auth')) {
		throw redirect(303, '/auth/login');
	}

	return resolve(event);
};

export const handle = sequence(csrf([], ["http://localhost:3000", "http://localhost:4173", "http://localhost:5173"]), handleParaglide, handleAuth);

if (dev) {
	const { server } = await import('./mocks/server');

	server.listen();
}
