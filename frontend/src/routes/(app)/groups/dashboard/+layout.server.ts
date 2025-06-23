import type { LayoutServerLoad } from './$types';
import { building } from '$app/environment';
import { getGroupLayoutData } from '$lib/server/layout-data';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { zUpdateGroup } from '$lib/client/zod.gen';

export const load: LayoutServerLoad = async ({ request, url }) => {
	//If svelte is precompiling, return only the validator
	if (building) {
		return {
			updateGroupNameForm: await superValidate(zod(zUpdateGroup))
		};
	}

	const groupId = url.searchParams.get('groupId');

	return getGroupLayoutData(groupId as string, request);
};
