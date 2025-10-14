import { building } from '$app/environment';
import { zGroupInviteCreate } from '$lib/client/zod.gen';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	// For static builds, return only the validator
	if (building) {
		return {
			inviteMemberForm: await superValidate(zod(zGroupInviteCreate))
		};
	}

	await parent();

	const inviteMemberForm = await superValidate(zod(zGroupInviteCreate));

	return {
		inviteMemberForm
	};
};

