import { getRootLayoutData } from '$lib/server/layout-data';
import type { LayoutServerLoad } from './$types';
import { building } from '$app/environment';

export const load: LayoutServerLoad = async ({ cookies }) => {
	if (building){
		return {
			user: null,
			groups: null
		};
	}
	
	return getRootLayoutData(cookies);
};
