import { browser } from '$app/environment';
import { QueryClient } from '@tanstack/svelte-query';

let browserClient: QueryClient | undefined;

const defaults = {
	queries: {
		staleTime: 30 * 1000,
		refetchOnWindowFocus: false
	}
};

/**
 * Per-request on SSR, singleton on the client. Dehydrated on the server and
 * hydrated in the browser by the root layout, so queries prefetched in
 * `+page.ts` appear to the component without a second network round-trip.
 */
export function createQueryClient(): QueryClient {
	if (browser) {
		if (!browserClient) {
			browserClient = new QueryClient({ defaultOptions: defaults });
		}
		return browserClient;
	}

	return new QueryClient({ defaultOptions: defaults });
}
