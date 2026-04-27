import { zCreateGroup } from '$lib/shared/form/validators';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	return {
		groupCreateForm: await superValidate(zod(zCreateGroup))
	};
};
