import { building } from '$app/environment';
import {
	createTransactionTransactionsPost,
	getUserBalancesBalancesGet,
	readTransactionsUserIsParticipantInTransactionsGet,
	type Balance,
	type TransactionRead
} from '$lib/client';
import { zTransactionCreate } from '$lib/client/zod.gen';
import { isCompiledStatic } from '$lib/shared/app/controller';
import type { Cookies } from '@sveltejs/kit';
import { error, fail, redirect } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';
import { setMessage, superValidate } from 'sveltekit-superforms/server';
import type { Actions, PageServerLoad } from './$types';

async function getPageData(
	fetch: Fetch,
	cookies: Cookies
): Promise<{
	balance: Balance;
	transactions: TransactionRead[];
}> {
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
			cookies.delete('auth_token', { path: '/' });
			return redirect(302, '/auth/login');
		}
		return error(500, {
			message: 'Failed to fetch balance or recent transactions'
		});
	}

	const [balance, transactions] = [balanceRes.data, recentRes.data];

	if (transactions === undefined || balance === undefined) {
		return error(500, {
			message: 'Failed to fetch data'
		});
	}

	return {
		balance,
		transactions
	};
}

export const load: PageServerLoad = async ({
	fetch,
	cookies
}): Promise<
	| {
			balance: Balance;
			transactions: TransactionRead[];
	  }
	| Record<string, never>
> => {
	//If svelte is precompiling, return empty object
	if (building) {
		return {};
	}

	return getPageData(fetch, cookies);
};

export const actions: Actions | undefined = isCompiledStatic()
	? undefined
	: {
			create: async ({ request }) => {
				const form = await superValidate(request, zod(zTransactionCreate));

				if (!form.valid) {
					return fail(400, { form });
				}

				// Pass the form data to the API
				const result = await createTransactionTransactionsPost({
					body: form.data
				});

				if (result.error) {
					return setMessage(form, 'Failed to create transaction', { status: 400 });
				}

				return setMessage(form, 'Transaction created successfully');
			}
		};
