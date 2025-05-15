import type { LayoutServerLoad } from './$types';
import { building } from '$app/environment';
import { getGroupLayoutData } from '$lib/server/layout-data';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { zUpdateGroup } from '$lib/client/zod.gen';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ request, url }) => {
	if (building){
		const updateGroupNameForm = await superValidate(request, zod(zUpdateGroup));
		return {
			updateGroupNameForm
		};
	}

	const groupId = url.searchParams.get('groupId');
	if (!groupId) {
		throw redirect(303, '/groups');
	}	

	return getGroupLayoutData(groupId as string, request);
};
