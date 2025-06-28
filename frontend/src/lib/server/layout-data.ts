import { readGroupGroupsGroupIdGet, type Group } from '$lib/client';
import { zUpdateGroup } from '$lib/client/zod.gen';
import { error, redirect } from '@sveltejs/kit';
import { superValidate, type SuperValidated } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
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
		return error(500, 'Failed to load group data');
	}

	if (!groupResponse.data) {
		throw redirect(302, '/');
	}

	updateGroupNameForm.data.name ??= groupResponse.data.name;

	return {
		groupData: groupResponse.data,
		updateGroupNameForm
	};
}
