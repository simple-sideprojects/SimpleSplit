import { loginAuthLoginPost, readUsersMeAccountGet } from '$lib/client/sdk.gen';
import { fail, type ActionFailure, type Actions } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';
import { setMessage, superValidate, type SuperValidated } from 'sveltekit-superforms/server';
import { isCompiledStatic } from '$lib/shared/app/controller';
import { zEmailPasswordLogin } from '$lib/shared/form/validators';
import type { UserResponse } from '$lib/client';
import type { z } from 'zod';
import { building } from '$app/environment';
import type { PageServerLoad } from './$types';

async function getPageData() {
	const loginForm = await superValidate(zod(zEmailPasswordLogin));
	return { loginForm };
};

export const load: PageServerLoad = async () => {
	if (building){
		//If svelte is precompiling, return only the validator
		return {
			loginForm: await superValidate(zod(zEmailPasswordLogin))
		};
	}
	
	return getPageData();
};


export const actions: Actions|undefined = isCompiledStatic() ? undefined : {
	data: async (): Promise<{
		loginForm: SuperValidated<z.infer<typeof zEmailPasswordLogin>>
	}> => {
		return getPageData();
	},
	login: async ({ request, cookies }): Promise<{
		token: string,
		user: UserResponse,
		form: SuperValidated<z.infer<typeof zEmailPasswordLogin>>
	}|ActionFailure<{
		form: SuperValidated<z.infer<typeof zEmailPasswordLogin>>
	}>> => {
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

			const userResponse = await readUsersMeAccountGet();
			if(userResponse.data === undefined){
				setMessage(form, 'An unexpected error occurred during registration.');
				return fail(500, { form });
			}

			return {
				token: loginResponse.data.access_token,
				user: userResponse.data,
				form
			}
		} catch (error) {
			setMessage(form, 'Invalid email or password');
			return fail(401, { form });
		}
	}
};
