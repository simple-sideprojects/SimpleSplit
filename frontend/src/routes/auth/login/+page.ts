import { zEmailPasswordLogin } from '$lib/shared/form/validators';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	return {
		loginForm: await superValidate(zod(zEmailPasswordLogin))
	};
};
