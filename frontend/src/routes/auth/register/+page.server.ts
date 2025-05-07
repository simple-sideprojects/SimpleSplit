import { loginAuthLoginPost, registerAuthRegisterPost } from '$lib/client/sdk.gen';
import { zUserCreate } from '$lib/client/zod.gen';
import { fail, redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { isCompiledStatic } from '$lib/shared/app/controller';
import { building } from '$app/environment';

const registerSchema = zUserCreate;

async function getPageData() {
	const form = await superValidate(zod(registerSchema));
	return { form };
};

export const load: PageServerLoad = async () => {
	if (building){
		return getPageData();
	}

	return getPageData();
};

export const actions: Actions|undefined = isCompiledStatic() ? undefined : {
	data: async () => {
		return getPageData();
	},
	register: async ({ request, cookies }) => {
		const form = await superValidate(request, zod(registerSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { email, password, username } = form.data;

		await registerAuthRegisterPost({
			body: { email, password, username },
			throwOnError: true
		});

		const loginResponse = await loginAuthLoginPost({
			body: {
				username: email,
				password: password,
				scope: ''
			}
		});

		if (!loginResponse?.data) {
			return setError(form, '', 'An unexpected error occurred during registration.');
		}

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
	}
};
