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
			// Use form.data directly as it's already validated
			const loginResponse = await loginAuthLoginPost({
				body: {
					username: form.data.email, // Map email to username
					password: form.data.password
				},
				throwOnError: true
			});

			// Store token in a secure HTTP-only cookie
			cookies.set('auth_token', loginResponse.data.access_token, {
				path: '/',
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 60 * 24 * 7, // 1 week
				sameSite: 'strict'
			});
		} catch (error) {
			// Handle API errors (assuming non-validation errors are API/login errors)
			console.error('Login error:', error);
			// Use message to return a form-level error message
			return message(form, 'Invalid email or password', {
				status: 401 // Unauthorized status
			});
		}

		return redirect(303, '/');
	}
};
