import { env } from '$env/dynamic/public';
import type { Actions, PageServerLoad } from './$types';
import { isCompiledStatic } from '$lib/shared/app/controller';
import { building } from '$app/environment';
import { getGroupLayoutData } from '$lib/server/layout-data';
import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { readGroupTransactionsGroupsGroupIdTransactionsGet } from '$lib/client';

async function getPageData(fetch: Fetch, groupId: string) {
	const [balanceRes, recentRes] = await Promise.all([
		fetch(`${env.PUBLIC_BACKEND_URL}/groups/${groupId}/balance`),
        readGroupTransactionsGroupsGroupIdTransactionsGet({
            path: {
                group_id: groupId
            }
        })
	]);

	const [balances, transactions] = await Promise.all([balanceRes.json(), recentRes.data]);

	return {
		balances,
		transactions
	};
};

export const load: PageServerLoad = async ({ fetch, url }) => {
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

	return getPageData(fetch, groupId);
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
	data: async ({ fetch, request }) => {
		const data = await request.formData();
		const groupId = data.get('groupId');

		if (!groupId) {
			throw redirect(303, '/groups');
		}

		return getPageData(fetch, groupId as string);
	}
};
