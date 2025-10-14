import { building } from '$app/environment';
import { readGroupGroupsGroupIdGet, type Group } from '$lib/client';
import { zUpdateGroup } from '$lib/client/zod.gen';
import { error, redirect } from '@sveltejs/kit';
import { superValidate, type SuperValidated } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { z } from 'zod';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url, parent }) => {
	// For static builds, return empty data to avoid build-time API calls
	if (building) {
		return {
			updateGroupNameForm: await superValidate(zod(zUpdateGroup))
		};
	}

	await parent();

	const groupId = url.searchParams.get('groupId');

	if (!groupId) {
		throw redirect(303, '/groups');
	}

	const updateGroupNameForm = await superValidate(zod(zUpdateGroup));

	const groupResponse = await readGroupGroupsGroupIdGet({
		path: {
			group_id: groupId
		}
	});

	if (groupResponse.error) {
		if (groupResponse.response.status === 401) {
			throw redirect(302, '/auth/login');
		}
		throw error(500, 'Failed to load group data');
	}

	if (!groupResponse.data) {
		throw redirect(302, '/');
	}

	updateGroupNameForm.data.name ??= groupResponse.data.name;

	return {
		groupData: groupResponse.data,
		updateGroupNameForm: updateGroupNameForm as SuperValidated<z.infer<typeof zUpdateGroup>>
	};
};

