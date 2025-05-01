import { acceptInviteInvitesAcceptTokenGet } from '$lib/client';
import { redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { building } from '$app/environment';
import { isCompiledStatic } from '$lib/app/controller';

async function getPageData(token: string) {
	if (!token) {
		throw redirect(303, '/');
	}

	const { data: inviteData } = await acceptInviteInvitesAcceptTokenGet({
		path: { token }
	});

	if (!inviteData) {
		throw redirect(303, '/');
	}

	throw redirect(301, '/');
};

export const load: PageServerLoad = async ({ params }) => {
	if (building){
		return {};
	}
	
	return getPageData(params.token);
};

export const actions: Actions|undefined = isCompiledStatic() ? undefined : {
	data: async ({ params }) => {
		return getPageData(params.token || '');
	}
};
