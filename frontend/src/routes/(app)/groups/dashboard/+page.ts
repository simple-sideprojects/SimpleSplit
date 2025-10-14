import { building } from '$app/environment';
import { env } from '$env/dynamic/public';
import {
	readGroupTransactionsGroupsGroupIdTransactionsGet,
	type Balance,
	type TransactionRead
} from '$lib/client';
import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url, fetch, parent }) => {
	// For static builds, return empty data to avoid build-time API calls
	if (building) {
		return {
			balance: {} as Balance,
			transactions: [] as TransactionRead[]
		};
	}

	await parent();

	const groupId = url.searchParams.get('groupId');

	if (!groupId) {
		throw redirect(303, '/groups');
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
			throw redirect(302, '/auth/login');
		}

		throw error(500, {
			message: 'Failed to fetch balance or recent transactions'
		});
	}

	const [balance, transactions] = await Promise.all([balanceRes.json(), Promise.resolve(recentRes.data)]);

	return {
		balance: balance as Balance,
		transactions: transactions as TransactionRead[]
	};
};

