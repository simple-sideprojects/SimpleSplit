import { zGroupInviteCreate } from '$lib/client/zod.gen';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	return {
		inviteMemberForm: await superValidate(zod(zGroupInviteCreate))
	};
};
