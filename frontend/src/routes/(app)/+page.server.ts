import { env } from '$env/dynamic/public';
import type { Actions, PageServerLoad } from './$types';
import { isCompiledStatic } from '$lib/shared/app/controller';
import { building } from '$app/environment';
import { getRootLayoutData } from '$lib/server/layout-data';

async function getPageData(fetch: Fetch) {
	const [balanceRes, recentRes] = await Promise.all([
		fetch(`${env.PUBLIC_BACKEND_URL}/balance`),
		fetch(`${env.PUBLIC_BACKEND_URL}/recent`)
	]);

	const [balances, transactions] = await Promise.all([balanceRes.ok ? balanceRes.json() : [], recentRes.ok ? recentRes.json() : []]);

	return {
		balances,
		transactions
	};
};

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	if (building){
		return {
			balances: [],
			transactions: []
		};
	}
	
	return getPageData(fetch);
};

export const actions: Actions|undefined = isCompiledStatic() ? undefined : {
	data: async ({ fetch, cookies }) => {
		let page_data = await getPageData(fetch);
		let layout_data = await getRootLayoutData(cookies);
		return {
			...page_data,
			...layout_data
		};
	}
};
