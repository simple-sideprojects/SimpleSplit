import { createQueryClient } from '$lib/query/client';
import { dehydrate } from '@tanstack/svelte-query';
import type { LayoutLoad } from './$types';

export const trailingSlash = 'always';

/**
 * Universal root load. Owns the `QueryClient` that both SSR prefetches and
 * the browser hydrates into. Per-request on the server, singleton in the
 * browser (see `createQueryClient`).
 */
export const load: LayoutLoad = () => {
	const queryClient = createQueryClient();

	return {
		queryClient,
		dehydratedState: dehydrate(queryClient)
	};
};
