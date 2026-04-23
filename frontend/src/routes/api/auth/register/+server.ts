import {
	loginAuthLoginPost,
	readUsersMeAccountGet,
	registerAuthRegisterPost
} from '$lib/client/sdk.gen';
import { createServerApiClient } from '$lib/server/api';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const prerender = false;

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export const POST: RequestHandler = async ({ request, cookies, fetch }) => {
	const body = (await request.json().catch(() => null)) as
		| { email?: string; password?: string; username?: string }
		| null;
	if (!body?.email || !body?.password || !body?.username) {
		error(400, 'email, password and username required');
	}

	const unauthed = createServerApiClient({ fetch });
	const register = await registerAuthRegisterPost({
		client: unauthed,
		body: { email: body.email, password: body.password, username: body.username },
		throwOnError: false
	});
	if (register.error) {
		error(400, 'Registration failed');
	}

	const login = await loginAuthLoginPost({
		client: unauthed,
		body: { username: body.email, password: body.password },
		throwOnError: false
	});
	if (login.error || !login.data) {
		error(500, 'Registration succeeded but login failed');
	}

	const token = login.data.access_token;

	cookies.set('auth_token', token, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		maxAge: COOKIE_MAX_AGE,
		sameSite: 'strict'
	});

	const authed = createServerApiClient({ fetch, token });
	const user = await readUsersMeAccountGet({ client: authed, throwOnError: false });
	if (user.error || !user.data) {
		error(500, 'Could not read user profile');
	}

	return json({ token, user: user.data });
};
