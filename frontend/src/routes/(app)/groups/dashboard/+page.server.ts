import { env } from '$env/dynamic/public';
import type { Actions, PageServerLoad } from './$types';
import { isCompiledStatic } from '$lib/shared/app/controller';
import { building } from '$app/environment';
import { getGroupLayoutData } from '$lib/server/layout-data';
import { error, redirect, type Cookies } from '@sveltejs/kit';
import {
	readGroupTransactionsGroupsGroupIdTransactionsGet,
	type Group,
	type TransactionRead
} from '$lib/client';
import type { Balance } from '$lib/interfaces/balance';
import type { SuperValidated } from 'sveltekit-superforms';
import type { zUpdateGroup } from '$lib/client/zod.gen';
import type { z } from 'zod';

async function getPageData(
	fetch: Fetch,
	groupId: string | null,
	cookies: Cookies
): Promise<{
	balances: Balance[];
	transactions: TransactionRead[];
}> {
	if (!groupId) {
		return redirect(303, '/groups');
	}

	const [balanceRes, recentRes] = await Promise.all([
		fetch(`${env.PUBLIC_BACKEND_URL}/groups/${groupId}/balance`),
		readGroupTransactionsGroupsGroupIdTransactionsGet({
			path: {
				group_id: groupId
			}
		})
	]);

	if (!balanceRes.ok || recentRes.error) {
		if (balanceRes.status === 401) {
			cookies.delete('auth_token', { path: '/' });
			return redirect(302, '/auth/login');
		}

		return error(500, {
			message: 'Failed to fetch balance or recent transactions'
		});
	}

	const [balances, transactions] = await Promise.all([balanceRes.json(), recentRes.data]);

	return {
		balances,
		transactions
	};
}

export const load: PageServerLoad = async ({
	fetch,
	url,
	cookies
}): Promise<
	| {
			balances: Balance[];
			transactions: TransactionRead[];
	  }
	| {}
> => {
	//If svelte is precompiling, return nothing
	if (building) {
		return {};
	}

	const groupId = url.searchParams.get('groupId');

	return getPageData(fetch, groupId, cookies);
};

export const actions: Actions | undefined = isCompiledStatic()
	? undefined
	: {
			data_layout: async ({
				request
			}): Promise<{
				groupData: Group;
				updateGroupNameForm: SuperValidated<z.infer<typeof zUpdateGroup>>;
			}> => {
				const data = await request.formData();
				const groupId = data.get('groupId');

				return getGroupLayoutData(groupId as string, request);
			},
			data: async ({
				fetch,
				request,
				cookies
			}): Promise<{
				balances: Balance[];
				transactions: TransactionRead[];
			}> => {
				const data = await request.formData();
				const groupId = data.get('groupId');

				return getPageData(fetch, groupId as string, cookies);
			}
		};
