import { PUBLIC_BACKEND_URL } from '$env/static/public';
import {
	balancesQueryOptions,
	myTransactionsQueryOptions
} from '$lib/query/options';
import { createClient, createConfig } from '@hey-api/client-fetch';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { queryClient } = await parent();
	const client = createClient(createConfig({ baseUrl: PUBLIC_BACKEND_URL, fetch }));

	await Promise.all([
		queryClient.prefetchQuery(balancesQueryOptions(client)),
		queryClient.prefetchQuery(myTransactionsQueryOptions({ limit: 5 }, client))
	]);

	return {};
};
