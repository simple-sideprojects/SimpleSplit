import { loginAuthLoginPost, registerAuthRegisterPost } from '$lib/client/sdk.gen';
import { zUserCreate } from '$lib/client/zod.gen';
import { fail, redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';

const registerSchema = zUserCreate;

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod(registerSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, zod(registerSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { email, password, username } = form.data;

		try {
			await registerAuthRegisterPost({
				body: { email, password, username },
				throwOnError: true
			});

			const loginResponse = await loginAuthLoginPost({
				body: {
					username: email,
					password: password,
					scope: ''
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

			throw redirect(303, '/dashboard');
		} catch (error: unknown) {
			if (error instanceof Error && error.message.includes('fetch')) {
				return setError(form, '', 'The server is currently unavailable. Please try again later.');
			}

			return setError(form, '', 'An unexpected error occurred during registration.');
		}
	}
};
