import { getRootLayoutData } from '$lib/server/layout-data';
import type { LayoutServerLoad } from './$types';
import { building } from '$app/environment';
import type { Group, UserResponse } from '$lib/client';

export const load: LayoutServerLoad = async ({
	cookies
}): Promise<
	| {
			user: UserResponse;
			groups: Group[];
	  }
	| {}
> => {
	//If svelte is precompiling, return empty object
	if (building) {
		return {};
	}

	return getRootLayoutData(cookies);
};
