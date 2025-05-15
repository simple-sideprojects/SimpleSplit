import { env } from '$env/dynamic/public';
import type { Actions, PageServerLoad } from './$types';
import { isCompiledStatic } from '$lib/shared/app/controller';
import { building } from '$app/environment';
import { getRootLayoutData } from '$lib/server/layout-data';
import { error, redirect } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
async function getPageData(fetch: Fetch, cookies: Cookies) {
	const [balanceRes, recentRes] = await Promise.all([
		fetch(`${env.PUBLIC_BACKEND_URL}/balance`),
		fetch(`${env.PUBLIC_BACKEND_URL}/recent`)
	]);

	if (!balanceRes.ok || !recentRes.ok) {
		if(balanceRes.status === 401 || recentRes.status === 401){
			cookies.delete('auth_token', { path: '/' });
			throw redirect(302, '/auth/login');
		}
		console.log(balanceRes);
		console.log(recentRes);
		throw error(500, {
			message: 'Failed to fetch balance or recent transactions'
		});
	}

	const [balances, transactions] = await Promise.all([balanceRes.json(), recentRes.json()]);

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
	
	return getPageData(fetch, cookies);
};

export const actions: Actions|undefined = isCompiledStatic() ? undefined : {
	data_layout: async ({ cookies }) => {
		let layout_data = await getRootLayoutData(cookies);
		return layout_data;
	},
	data: async ({ fetch, cookies }) => {
		let page_data = await getPageData(fetch, cookies);
		return page_data;
	}
};
