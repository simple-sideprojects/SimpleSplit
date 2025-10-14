import { building } from '$app/environment';
import { acceptInviteInvitesAcceptTokenPut } from '$lib/client';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url, parent }) => {
	if (building) {
		return {};
	}

	await parent();

	const token = url.searchParams.get('token');

	if (!token) {
		throw redirect(303, '/groups');
	}

	const { data: inviteData } = await acceptInviteInvitesAcceptTokenPut({
		path: { token }
	});

	if (!inviteData) {
		throw redirect(303, '/groups');
	}

	throw redirect(301, '/groups');
};

