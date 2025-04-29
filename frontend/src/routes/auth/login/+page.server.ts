import { loginAuthLoginPost } from '$lib/client/sdk.gen';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';
import { message, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import type { PageServerLoad } from './$types';

const zEmailPasswordLogin = z.object({
	email: z.string(),
	password: z.string()
});

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod(zEmailPasswordLogin));
	return { form };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, zod(zEmailPasswordLogin));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const loginResponse = await loginAuthLoginPost({
				body: {
					username: form.data.email,
					password: form.data.password
				},
				throwOnError: true
			});

			cookies.set('auth_token', loginResponse.data.access_token, {
				path: '/',
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 60 * 24 * 7,
				sameSite: 'strict'
			});
		} catch (error) {
			console.error('Login error:', error);

			return message(form, 'Invalid email or password', {
				status: 401
			});
		}

		return redirect(303, '/');
	}
};
