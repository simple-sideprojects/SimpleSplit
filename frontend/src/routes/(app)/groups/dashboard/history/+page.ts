import { PUBLIC_BACKEND_URL } from '$env/static/public';
import { groupTransactionsQueryOptions } from '$lib/query/options';
import { createClient, createConfig } from '@hey-api/client-fetch';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, fetch, url }) => {
	const { queryClient } = await parent();
	const groupId = url.searchParams.get('groupId');
	if (!groupId) redirect(303, '/groups');

	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const limit = parseInt(url.searchParams.get('limit') || '25', 10);
	const skip = (page - 1) * limit;

	const client = createClient(createConfig({ baseUrl: PUBLIC_BACKEND_URL, fetch }));

	await queryClient.prefetchQuery(groupTransactionsQueryOptions(groupId, { skip, limit }, client));

	return { groupId, page, limit };
};
