import { PUBLIC_BACKEND_URL } from '$env/static/public';
import { zUpdateGroup } from '$lib/client/zod.gen';
import { groupQueryOptions } from '$lib/query/options';
import { createClient, createConfig } from '@hey-api/client-fetch';
import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent, fetch, url }) => {
	const { queryClient } = await parent();
	const groupId = url.searchParams.get('groupId');

	if (!groupId) {
		redirect(303, '/groups');
	}

	const client = createClient(createConfig({ baseUrl: PUBLIC_BACKEND_URL, fetch }));

	try {
		await queryClient.prefetchQuery(groupQueryOptions(groupId, client));
	} catch {
		redirect(302, '/groups');
	}

	return {
		groupId,
		updateGroupNameForm: await superValidate(zod(zUpdateGroup))
	};
};
