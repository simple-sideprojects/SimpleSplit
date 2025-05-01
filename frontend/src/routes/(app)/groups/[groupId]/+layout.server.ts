import type { LayoutServerLoad } from './$types';
import { building } from '$app/environment';
import { getGroupLayoutData } from '$lib/server/layout-data';

export const load: LayoutServerLoad = async ({ params, request }) => {
	if (building){
		return {};
	}
	
	return getGroupLayoutData(params.groupId || '', request);
};
