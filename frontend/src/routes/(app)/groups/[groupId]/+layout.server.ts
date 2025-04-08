import { readGroupGroupsGroupIdGet } from '$lib/client';
import { zUpdateGroup } from '$lib/client/zod.gen';
import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, request }) => {
	const updateGroupNameForm = await superValidate(request, zod(zUpdateGroup));

	const groupResponse = await readGroupGroupsGroupIdGet({
		path: {
			group_id: params.groupId
		}
	});

	if (!groupResponse.data) {
		return redirect(302, '/');
	}

	if (!updateGroupNameForm.data.name) {
		updateGroupNameForm.data.name = groupResponse.data.name;
	}

	return {
		group: groupResponse.data,
		updateGroupNameForm
	};
};
