import { readGroupGroupsGroupIdGet, type Group, type UserResponse } from '$lib/client';
import { zUpdateGroup } from '$lib/client/zod.gen';
import { error, redirect, type Cookies } from '@sveltejs/kit';
import { superValidate, type SuperValidated } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { readGroupsGroupsGet, readUsersMeAccountGet } from '$lib/client';
import type { z } from 'zod';

export async function getGroupLayoutData(
	groupId: string | null,
	request: Request
): Promise<{
	groupData: Group;
	updateGroupNameForm: SuperValidated<z.infer<typeof zUpdateGroup>>;
}> {
	if (!groupId) {
		return redirect(303, '/groups');
	}

	const updateGroupNameForm = await superValidate(request, zod(zUpdateGroup));

	const groupResponse = await readGroupGroupsGroupIdGet({
		path: {
			group_id: groupId
		}
	});

	if (groupResponse.error) {
		if (groupResponse.response.status === 401) {
			return redirect(302, '/auth/login');
		}
		return error(500, {
			message: groupResponse.error
		});
	}

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
}

export async function getRootLayoutData(cookies: Cookies): Promise<{
	user: UserResponse;
	groups: Group[];
}> {
	const userResponse = await readUsersMeAccountGet();
	const groupsResponse = await readGroupsGroupsGet();

	if (userResponse.error || groupsResponse.error) {
		if (userResponse.response.status === 401 || groupsResponse.response.status === 401) {
			cookies.delete('auth_token', { path: '/' });
			return redirect(302, '/auth/login');
		}
		return error(500, {
			message: userResponse.error
		});
	}

	if (!userResponse.data || !groupsResponse.data) {
		return redirect(302, '/');
	}

	return {
		user: userResponse.data,
		groups: groupsResponse.data ?? []
	};
}
