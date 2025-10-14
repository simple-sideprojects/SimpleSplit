import {
	deleteTransactionTransactionsTransactionIdDelete,
	updateTransactionTransactionsTransactionIdPut
} from '$lib/client';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	edit: async ({ request }) => {
		const formData = await request.formData();
		const groupId = formData.get('groupId');

		if (!groupId) {
			throw redirect(303, '/groups');
		}

		const id = formData.get('id');
		const description = formData.get('description');
		const amount = formData.get('amount');

		if (!id || !description || !amount) {
			return fail(400, { error: 'Missing required fields' });
		}

		try {
			const response = await updateTransactionTransactionsTransactionIdPut({
				path: {
					transaction_id: id as string
				},
				body: {
					title: description as string,
					amount: Math.round(parseFloat(amount as string) * 100)
				}
			});

			if (response.error) {
				throw new Error('Failed to update transaction');
			}

			return { success: true };
		} catch (error) {
			return fail(500, {
				error: error instanceof Error ? error.message : 'Failed to update transaction'
			});
		}
	},
	delete: async ({ request }) => {
		const formData = await request.formData();
		const groupId = formData.get('groupId');

		if (!groupId) {
			throw redirect(303, '/groups');
		}

		const id = formData.get('id');

		if (!id) {
			return fail(400, { error: 'Missing transaction ID' });
		}

		try {
			const response = await deleteTransactionTransactionsTransactionIdDelete({
				path: {
					transaction_id: id as string
				}
			});

			if (response.error) {
				throw new Error('Failed to delete transaction');
			}

			return { success: true };
		} catch (error) {
			return fail(500, {
				error: error instanceof Error ? error.message : 'Failed to delete transaction'
			});
		}
	}
};
