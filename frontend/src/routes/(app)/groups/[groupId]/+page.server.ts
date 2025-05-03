import { env } from '$env/dynamic/public';
import type { Actions, PageServerLoad } from './$types';
import { isCompiledStatic } from '$lib/shared/app/controller';
import { building } from '$app/environment';
import { getGroupLayoutData } from '$lib/server/layout-data';

async function getPageData(fetch: Fetch, groupId: string) {
	const [balanceRes, recentRes] = await Promise.all([
		fetch(`${env.PUBLIC_BACKEND_URL}/groups/${groupId}/balance`),
		fetch(`${env.PUBLIC_BACKEND_URL}/groups/${groupId}/recent`)
	]);

	const [balances, transactions] = await Promise.all([balanceRes.ok ? balanceRes.json() : [], recentRes.ok ? recentRes.json() : []]);

	return {
		balances,
		transactions
	};
};

export const load: PageServerLoad = async ({ fetch, params }) => {
	if (building){
		return {
			balances: [],
			transactions: []
		};
	}
	
	return getPageData(fetch, params.groupId);
};

export const actions: Actions|undefined = isCompiledStatic() ? undefined : {
	data: async ({ fetch, params, request }) => {
		let page_data = await getPageData(fetch, params.groupId);
	
		let layout_data = await getGroupLayoutData(params.groupId, request);
		return {
			...page_data,
			...layout_data
		};
	}
};
