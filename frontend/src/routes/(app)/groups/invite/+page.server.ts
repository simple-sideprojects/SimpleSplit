import { acceptInviteInvitesAcceptTokenGet } from '$lib/client';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { building } from '$app/environment';
import { isCompiledStatic } from '$lib/shared/app/controller';

async function getPageData(token: string|null) {
	if (!token) {
		return redirect(303, '/groups');
	}

	const { data: inviteData } = await acceptInviteInvitesAcceptTokenGet({
		path: { token }
	});

	if (!inviteData) {
		return redirect(303, '/groups');
	}

	return redirect(301, '/groups');
};

export const load: PageServerLoad = async ({ url }) => {
	if (building){
		return {};
	}

	const token = url.searchParams.get('token');
	
	return getPageData(token);
};

export const actions: Actions|undefined = isCompiledStatic() ? undefined : {
	data: async ({ request }) => {
		const data = await request.formData();
		const token = data.get('token');

		return getPageData(token as string);
	}
};
