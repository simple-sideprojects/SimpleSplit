import { env } from '$env/dynamic/public';
import type { Actions, PageServerLoad } from './$types';
import { isCompiledStatic } from '$lib/app/controller';
import { building } from '$app/environment';

async function getPageData(fetch: Fetch) {
	const response = await fetch(`${env.PUBLIC_BACKEND_URL}/api/groups`);
	const groups = await response.json();

	return {
		groups
	};
};

export const load: PageServerLoad = async ({ fetch }) => {
	if (building){
		return {
			groups: []
		};
	}
	
	return getPageData(fetch);
};

export const actions: Actions|undefined = isCompiledStatic() ? undefined : {
	data: async ({ fetch }) => {
		return getPageData(fetch);
	}
};
