import {
	loginAuthLoginPost,
	readUsersMeAccountGet,
	registerAuthRegisterPost
} from '$lib/client/sdk.gen';
import { zUserCreate } from '$lib/client/zod.gen';
import { fail, type ActionFailure } from '@sveltejs/kit';
import { setMessage, superValidate, type SuperValidated } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { isCompiledStatic } from '$lib/shared/app/controller';
import { building } from '$app/environment';
import type { z } from 'zod';
import type { UserResponse } from '$lib/client';

const registerSchema = zUserCreate;

async function getPageData() {
	const registerForm = await superValidate(zod(registerSchema));
	return { registerForm };
}

export const load: PageServerLoad = async () => {
	//If svelte is precompiling, return only the validator
	if (building) {
		return {
			registerForm: await superValidate(zod(registerSchema))
		};
	}

	return getPageData();
};

export const actions: Actions | undefined = isCompiledStatic()
	? undefined
	: {
			data: async (): Promise<{
				registerForm: SuperValidated<z.infer<typeof registerSchema>>;
			}> => {
				return getPageData();
			},
			register: async ({
				request,
				cookies
			}): Promise<
				| {
						token: string;
						user: UserResponse;
						form: SuperValidated<z.infer<typeof registerSchema>>;
				  }
				| ActionFailure<{
						form: SuperValidated<z.infer<typeof registerSchema>>;
				  }>
			> => {
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
					setMessage(form, 'An unexpected error occurred during registration.');
					return fail(500, { form });
				}

				cookies.set('auth_token', loginResponse.data.access_token, {
					path: '/',
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					maxAge: 60 * 60 * 24 * 7,
					sameSite: 'strict'
				});

				const userResponse = await readUsersMeAccountGet();
				if (userResponse.data === undefined) {
					setMessage(form, 'An unexpected error occurred during registration.');
					return fail(500, { form });
				}

				return {
					token: loginResponse.data.access_token,
					user: userResponse.data,
					form
				};
			}
		};
