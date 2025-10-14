import { building } from '$app/environment';
import { zCreateGroup } from '$lib/shared/form/validators';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	// For static builds, return only the validator
	if (building) {
		return {
			groupCreateForm: await superValidate(zod(zCreateGroup))
		};
	}

	await parent();

	const groupCreateForm = await superValidate(zod(zCreateGroup));

	return {
		groupCreateForm
	};
};

