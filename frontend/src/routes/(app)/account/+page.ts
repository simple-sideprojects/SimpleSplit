import { zUserInfoUpdate } from '$lib/client/zod.gen';
import { meQueryOptions } from '$lib/query/options';
import { deleteAccountSchema, passwordFormSchema } from '$lib/shared/form/validators';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { PUBLIC_BACKEND_URL } from '$env/static/public';
import { createClient, createConfig } from '@hey-api/client-fetch';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { queryClient } = await parent();
	const client = createClient(createConfig({ baseUrl: PUBLIC_BACKEND_URL, fetch }));

	await queryClient.prefetchQuery(meQueryOptions(client));

	return {
		usernameForm: await superValidate(zod(zUserInfoUpdate)),
		passwordForm: await superValidate(zod(passwordFormSchema)),
		deleteAccountForm: await superValidate(zod(deleteAccountSchema))
	};
};
