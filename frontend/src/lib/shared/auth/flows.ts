import { PUBLIC_ADAPTER } from '$env/static/public';
import {
	loginAuthLoginPost,
	readUsersMeAccountGet,
	registerAuthRegisterPost
} from '$lib/client/sdk.gen';
import type { UserResponse } from '$lib/client/types.gen';
import { clientSideLogin } from '$lib/shared/stores/auth.store';

// adapter-static (Capacitor) has no SvelteKit server, so it must call the
// SDK directly; adapter-node uses /api/auth/* so the SSR cookie is set.
const isStatic = PUBLIC_ADAPTER === 'static';

export async function login(
	email: string,
	password: string
): Promise<{ token: string; user: UserResponse }> {
	if (isStatic) {
		const { data, error } = await loginAuthLoginPost({
			body: { username: email, password }
		});
		if (error || !data) throw error ?? new Error('Login failed');
		const token = data.access_token;

		const { data: user, error: userErr } = await readUsersMeAccountGet({
			headers: { Authorization: `Bearer ${token}` }
		});
		if (userErr || !user) throw userErr ?? new Error('Could not read user profile');

		await clientSideLogin(token, user);
		return { token, user };
	}

	const response = await fetch('/api/auth/login/', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password })
	});

	if (!response.ok) {
		const body = await response.json().catch(() => null);
		throw new Error(body?.detail || body?.error?.message || 'Invalid email or password');
	}

	const { token, user } = (await response.json()) as { token: string; user: UserResponse };
	await clientSideLogin(token, user);
	return { token, user };
}

export async function register(
	email: string,
	password: string,
	username: string
): Promise<{ token: string; user: UserResponse }> {
	if (isStatic) {
		const { error: regErr } = await registerAuthRegisterPost({
			body: { email, password, username }
		});
		if (regErr) throw regErr;
		return login(email, password);
	}

	const response = await fetch('/api/auth/register/', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password, username })
	});

	if (!response.ok) {
		const body = await response.json().catch(() => null);
		throw new Error(body?.detail || body?.error?.message || 'Registration failed');
	}

	const { token, user } = (await response.json()) as { token: string; user: UserResponse };
	await clientSideLogin(token, user);
	return { token, user };
}
