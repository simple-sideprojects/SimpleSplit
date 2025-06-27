import { building } from '$app/environment';
import type { Group, UserResponse } from '$lib/client';
import { getRootLayoutData } from '$lib/server/layout-data';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({
	cookies
}): Promise<
	| {
			user: UserResponse;
			groups: Group[];
	  }
	| object
> => {
	//If svelte is precompiling, return empty object
	if (building) {
		return {};
	}

	return getRootLayoutData(cookies);
};
