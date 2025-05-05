import { env } from '$env/dynamic/public';
import { readGroupTransactionsGroupsGroupIdTransactionsGet } from '$lib/client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const [balanceRes, recentRes] = await Promise.all([
		fetch(`${env.PUBLIC_BACKEND_URL}/groups/${params.groupId}/balance`),
		readGroupTransactionsGroupsGroupIdTransactionsGet({
			path: {
				group_id: params.groupId
			}
		})
	]);

	const [balances, transactions] = await Promise.all([balanceRes.json(), recentRes.data]);

	return {
		balances,
		transactions
	};
};
