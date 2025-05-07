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
import { superValidate } from 'sveltekit-superforms/server';

async function getPageData(fetch: Fetch) {
	const [balanceRes, recentRes] = await Promise.all([
		fetch(`${env.PUBLIC_BACKEND_URL}/balance`),
		readTransactionsUserIsParticipantInTransactionsGet({
			query: {
				limit: 5
			}
		})
	]);

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

	return getPageData(fetch);
};

export const actions: Actions|undefined = isCompiledStatic() ? undefined : {
	data: async ({ fetch, cookies }) => {
		let page_data = await getPageData(fetch);
		let layout_data = await getRootLayoutData(cookies);
		return {
			...page_data,
			...layout_data
		};
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
