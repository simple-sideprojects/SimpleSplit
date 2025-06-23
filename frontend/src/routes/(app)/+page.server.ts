import { env } from '$env/dynamic/public';
import {
	createTransactionTransactionsPost,
	readTransactionsUserIsParticipantInTransactionsGet,
	type Group,
	type TransactionRead,
	type UserResponse
} from '$lib/client';
import { zTransactionCreate } from '$lib/client/zod.gen';
import { fail } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { isCompiledStatic } from '$lib/shared/app/controller';
import { building } from '$app/environment';
import { getRootLayoutData } from '$lib/server/layout-data';
import { error, redirect } from '@sveltejs/kit';
import type { ActionFailure, Cookies } from '@sveltejs/kit';
import { setMessage, superValidate, type SuperValidated } from 'sveltekit-superforms/server';
import type { Balance } from '$lib/interfaces';
import type { z } from 'zod';

async function getPageData(
	fetch: Fetch,
	cookies: Cookies
): Promise<{
	balances: Balance[];
	transactions: TransactionRead[];
}> {
	const [balanceRes, recentRes] = await Promise.all([
		fetch(`${env.PUBLIC_BACKEND_URL}/balance`),
		readTransactionsUserIsParticipantInTransactionsGet({
			query: {
				limit: 5
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

	if (transactions === undefined) {
		return error(500, {
			message: 'Failed to fetch transactions'
		});
	}

	return {
		balances,
		transactions
	};
}

export const load: PageServerLoad = async ({
	fetch,
	cookies
}): Promise<
	| {
			balances: Balance[];
			transactions: TransactionRead[];
	  }
	| {}
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
			data_layout: async ({
				cookies
			}): Promise<{
				user: UserResponse;
				groups: Group[];
			}> => {
				const layout_data = await getRootLayoutData(cookies);
				return layout_data;
			},
			data: async ({
				fetch,
				cookies
			}): Promise<{
				balances: Balance[];
				transactions: TransactionRead[];
			}> => {
				const page_data = await getPageData(fetch, cookies);
				return page_data;
			},
			createTransaction: async ({
				request
			}): Promise<
				| {
						form: SuperValidated<z.infer<typeof zTransactionCreate>>;
				  }
				| ActionFailure<{
						form: SuperValidated<z.infer<typeof zTransactionCreate>>;
				  }>
			> => {
				const form = await superValidate(request, zod(zTransactionCreate));

				if (!form.valid) {
					return fail(400, { form });
				}

				const response = await createTransactionTransactionsPost({
					body: form.data,
					query: {
						group_id: form.data.group_id
					}
				});

				if (!response.data) {
					setMessage(form, 'An unexpected error occurred during transaction creation.');
					return fail(500, { form });
				}

				return { form };
			}
		};
