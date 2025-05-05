import { env } from '$env/dynamic/public';
import {
	createTransactionTransactionsPost,
	readTransactionsUserIsParticipantInTransactionsGet
} from '$lib/client';
import { zTransactionCreate } from '$lib/client/zod.gen';
import type { Actions } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';
import { superValidate } from 'sveltekit-superforms/server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
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

export const actions: Actions = {
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
