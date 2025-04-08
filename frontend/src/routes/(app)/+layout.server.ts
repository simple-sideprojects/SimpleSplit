import { readGroupsGroupsGet, readUsersMeAccountGet } from '$lib/client';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const userResponse = await readUsersMeAccountGet();
	const groupsResponse = await readGroupsGroupsGet();

	if (!userResponse.data) {
		cookies.delete('auth_token', { path: '/' });
		throw redirect(401, '/auth/login');
	}

	return {
		user: userResponse.data,
		groups: groupsResponse.data
	};
};
