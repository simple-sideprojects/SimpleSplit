import { groupsQueryOptions, meQueryOptions } from '$lib/query/options';
import { createClient, createConfig } from '@hey-api/client-fetch';
import { PUBLIC_BACKEND_URL } from '$env/static/public';
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent, fetch }) => {
	const { queryClient } = await parent();

	// A per-load SDK client bound to the SvelteKit load `fetch`. On SSR,
	// `hooks.server.ts` has already wrapped that fetch to inject the Bearer
	// header for requests to PUBLIC_BACKEND_URL; on the browser the shared
	// client's interceptor handles the token, so either works here.
	const client = createClient(createConfig({ baseUrl: PUBLIC_BACKEND_URL, fetch }));

	try {
		await Promise.all([
			queryClient.prefetchQuery(meQueryOptions(client)),
			queryClient.prefetchQuery(groupsQueryOptions(client))
		]);
	} catch {
		redirect(302, '/auth/login');
	}

	return {};
};
