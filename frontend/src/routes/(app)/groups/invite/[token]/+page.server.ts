import { acceptInviteInvitesAcceptTokenGet } from '$lib/client';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async ({ params }) => {
	const token = params.token;

	if (!token) {
		return redirect(303, '/');
	}

	const { data: inviteData } = await acceptInviteInvitesAcceptTokenGet({
		path: { token }
	});

	if (!inviteData) {
		return redirect(303, '/');
	}

	return redirect(301, '/');
};
