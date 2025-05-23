import { loginAuthLoginPost } from '$lib/client/sdk.gen';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';
import { message, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import type { PageServerLoad } from './$types';
import { isCompiledStatic } from '$lib/shared/app/controller';
import { building } from '$app/environment';

const zEmailPasswordLogin = z.object({
	email: z.string(),
	password: z.string()
});

async function getPageData() {
	const form = await superValidate(zod(zEmailPasswordLogin));
	return { form };
};

export const load: PageServerLoad = async () => {
	if (building){
		//This data is static and can be used for static builds
		return getPageData();
	}
	
	return getPageData();
};

export const actions: Actions|undefined = isCompiledStatic() ? undefined : {
	data: async () => {
		return getPageData();
	},
	login: async ({ request, cookies }) => {
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

			return {
				token: loginResponse.data.access_token,
				form
			}
		} catch (error) {
			console.error('Login error:', error);

			return message(form, 'Invalid email or password', {
				status: 401
			});
		}
	}
};
