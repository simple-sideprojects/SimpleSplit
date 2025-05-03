import { readGroupGroupsGroupIdGet } from '$lib/client';
import { zUpdateGroup } from '$lib/client/zod.gen';
import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { readGroupsGroupsGet, readUsersMeAccountGet } from '$lib/client';

export async function getGroupLayoutData(groupId: string, request: Request) {
	const updateGroupNameForm = await superValidate(request, zod(zUpdateGroup));

	const groupResponse = await readGroupGroupsGroupIdGet({
		path: {
			group_id: groupId
		}
	});

	if (!groupResponse.data) {
		throw redirect(302, '/');
	}

	if (!updateGroupNameForm.data.name) {
		updateGroupNameForm.data.name = groupResponse.data.name;
	}

	return {
		group: groupResponse.data,
		updateGroupNameForm
	};
};


export async function getRootLayoutData(cookies: any) {
	const userResponse = await readUsersMeAccountGet();
	const groupsResponse = await readGroupsGroupsGet();

	/*if (!userResponse.data) {
		cookies.delete('auth_token', { path: '/' });
		return redirect(302, '/auth/login');
	}*/

	return {
		user: userResponse.data,
		groups: groupsResponse.data ?? []
	};
};