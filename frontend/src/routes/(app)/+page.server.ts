import { env } from '$env/dynamic/public';
import {
    createTransactionTransactionsPost,
    readTransactionsUserIsParticipantInTransactionsGet
} from '$lib/client';
import { zTransactionCreate } from '$lib/client/zod.gen';
import { fail } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { isCompiledStatic } from '$lib/shared/app/controller';
import { building } from '$app/environment';
import { getRootLayoutData } from '$lib/server/layout-data';
import { error, redirect } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';

async function getPageData(fetch: Fetch, cookies: Cookies) {
	const [balanceRes, recentRes] = await Promise.all([
		fetch(`${env.PUBLIC_BACKEND_URL}/balance`),
		readTransactionsUserIsParticipantInTransactionsGet({
			query: {
				limit: 5
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
	},
    createTransaction: async ({ request }) => {
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
            return fail(500, { form });
        }

        return { form };
    }
};
