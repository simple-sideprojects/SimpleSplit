import { building } from '$app/environment';
import {
	getUserBalancesBalancesGet,
	readTransactionsUserIsParticipantInTransactionsGet,
	type Balance,
	type TransactionRead
} from '$lib/client';
import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	// For static builds, return empty data to avoid build-time API calls
	if (building) {
		return {
			balance: {
				user_id: '',
				total_balance: 0,
				total_owed_by_others: 0,
				total_owed_to_others: 0,
				user_balances: []
			} as Balance,
			transactions: [] as TransactionRead[]
		};
	}

	await parent();

	const [balanceRes, recentRes] = await Promise.all([
		getUserBalancesBalancesGet(),
		readTransactionsUserIsParticipantInTransactionsGet({
			query: {
				limit: 5
			}
		})
	]);

	if (balanceRes.error || recentRes.error) {
		// Check for authentication errors
		const isAuthError =
			(balanceRes.error &&
				typeof balanceRes.error === 'object' &&
				'status' in balanceRes.error &&
				balanceRes.error.status === 401) ||
			(recentRes.error &&
				typeof recentRes.error === 'object' &&
				'status' in recentRes.error &&
				recentRes.error.status === 401);

		if (isAuthError) {
			throw redirect(302, '/auth/login');
		}
		throw error(500, {
			message: 'Failed to fetch balance or recent transactions'
		});
	}

	const [balance, transactions] = [balanceRes.data, recentRes.data];

	if (transactions === undefined || balance === undefined) {
		throw error(500, {
			message: 'Failed to fetch data'
		});
	}

	return {
		balance,
		transactions
	};
};
