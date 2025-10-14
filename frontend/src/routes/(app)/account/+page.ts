import { building } from '$app/environment';
import { readUsersMeAccountGet } from '$lib/client';
import { zUserInfoUpdate } from '$lib/client/zod.gen';
import { deleteAccountSchema, passwordFormSchema } from '$lib/shared/form/validators';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	// For static builds, return only validators
	if (building) {
		return {
			usernameForm: await superValidate(zod(zUserInfoUpdate)),
			passwordForm: await superValidate(zod(passwordFormSchema)),
			deleteAccountForm: await superValidate(zod(deleteAccountSchema))
		};
	}

	await parent();

	const { data: userData, error } = await readUsersMeAccountGet();
	const validators = {
		usernameForm: await superValidate(zod(zUserInfoUpdate)),
		passwordForm: await superValidate(zod(passwordFormSchema)),
		deleteAccountForm: await superValidate(zod(deleteAccountSchema))
	};

	if (error || !userData) {
		console.error('Error fetching user data:', error);

		return validators;
	}

	return {
		userData,
		...validators
	};
};

