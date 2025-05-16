import { env } from '$env/dynamic/public';
import type { Actions, PageServerLoad } from './$types';
import { isCompiledStatic } from '$lib/shared/app/controller';
import { building } from '$app/environment';
import { getGroupLayoutData } from '$lib/server/layout-data';
import type { Actions, PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { readGroupTransactionsGroupsGroupIdTransactionsGet } from '$lib/client';

async function getPageData(fetch: Fetch, groupId: string, cookies: Cookies) {
	const [balanceRes, recentRes] = await Promise.all([
		fetch(`${env.PUBLIC_BACKEND_URL}/groups/${groupId}/balance`),
        readGroupTransactionsGroupsGroupIdTransactionsGet({
            path: {
                group_id: groupId
            }
        })
	]);

	if (!balanceRes.ok || recentRes.error) {
		if(balanceRes.status === 401){
			cookies.delete('auth_token', { path: '/' });
			throw redirect(302, '/auth/login');
		}
		console.log(balanceRes);
		console.log(recentRes);
		throw error(500, {
			message: 'Failed to fetch balance or recent transactions'
		});
	}

	const [balances, transactions] = await Promise.all([balanceRes.json(), recentRes.data]);

	return {
		balances,
		transactions
	};
};

export const load: PageServerLoad = async ({ fetch, url, cookies }) => {
	if (building){
		return {
			balances: [],
			transactions: []
		};
	}

	const groupId = url.searchParams.get('groupId');

	if (!groupId) {
		throw redirect(303, '/groups');
	}

	return getPageData(fetch, groupId, cookies);
};

export const actions: Actions|undefined = isCompiledStatic() ? undefined : {
	data_layout: async ({ request }) => {
		const data = await request.formData();
		const groupId = data.get('groupId');

		if (!groupId) {
			throw redirect(303, '/groups');
		}
		return getGroupLayoutData(groupId as string, request);
	},
	data: async ({ fetch, request, cookies }) => {
		const data = await request.formData();
		const groupId = data.get('groupId');

		if (!groupId) {
			throw redirect(303, '/groups');
		}

		return getPageData(fetch, groupId as string, cookies);
	}
};
