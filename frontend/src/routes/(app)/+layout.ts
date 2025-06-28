import { building } from '$app/environment';
import { readGroupsGroupsGet, readUsersMeAccountGet } from '$lib/client';
import { client } from '$lib/client/client.gen';
import { error, redirect } from '@sveltejs/kit';
import type { LayoutLoad } from '../$types';

export const load: LayoutLoad = async ({ data }) => {
	// For static builds, return empty data to avoid build-time API calls
	if (building) {
		return {
			user: null,
			groups: []
		};
	}

	const authToken = data as unknown as { authToken: string | null };

	client.interceptors.request.use((request) => {
		if (authToken.authToken) {
			request.headers.set('Authorization', `Bearer ${authToken.authToken}`);
		}
		return request;
	});

	const userResponse = await readUsersMeAccountGet();
	const groupsResponse = await readGroupsGroupsGet();

	if (userResponse.error || groupsResponse.error) {
		if (userResponse.response.status === 401 || groupsResponse.response.status === 401) {
			throw redirect(302, '/auth/login');
		}
		throw error(500, 'Failed to load user or group data');
	}

	if (!userResponse.data || !groupsResponse.data) {
		throw redirect(302, '/');
	}

	return {
		user: userResponse.data,
		groups: groupsResponse.data ?? []
	};
};
