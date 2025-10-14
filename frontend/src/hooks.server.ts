import { building, dev } from '$app/environment';
import { client } from '$lib/client/client.gen';
import { i18n } from '$lib/i18n';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { cors } from './lib/server/hooks/cors';
import { csrf } from './lib/server/hooks/csrf';
import * as jose from 'jose';
import { match, P } from 'ts-pattern';

const handleParaglide: Handle = i18n.handle();

export const handleAuth: Handle = ({ event, resolve }) => {
	if (building) {
		return resolve(event);
	}
	const token = event.cookies.get('auth_token');
	
	
	if (!token && !event.route.id?.includes('auth')) {
		return redirect(303, '/auth/login');
	}
	
	try {
		jose.decodeJwt(token ?? '');
	} catch (error) {
		event.cookies.delete('auth_token', { path: '/' });
		return resolve(event);
	}

	client.interceptors.request.use((request) => {
		request.headers.set('Authorization', `Bearer ${token}`);
		return request;
	});

	if (event.route.id?.includes('auth')) {
		throw redirect(303, '/');
	}

	return resolve(event);
};

const allowedOrigins = ['http://localhost:3000', 'http://localhost:4173', 'http://localhost:5173'];

export const handle = sequence(
	cors(allowedOrigins),
	csrf([], allowedOrigins),
	handleParaglide,
	handleAuth
);

if (dev) {
	const { server } = await import('./mocks/server');

	server.listen();
}
