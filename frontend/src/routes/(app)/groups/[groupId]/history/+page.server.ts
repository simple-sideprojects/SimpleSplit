import { env } from '$env/dynamic/public';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params, url }) => {
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '25');

	const [transactionsRes, totalRes] = await Promise.all([
		fetch(
			`${env.PUBLIC_BACKEND_URL}/api/groups/${params.groupId}/transactions?page=${page}&limit=${limit}`
		),
		fetch(`${env.PUBLIC_BACKEND_URL}/api/groups/${params.groupId}/transactions/total`)
	]);

	const [transactions, total] = await Promise.all([transactionsRes.json(), totalRes.json()]);

	return {
		groupId: params.groupId,
		transactions,
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit)
	};
};

export const actions: Actions = {
	edit: async ({ request, fetch, params }) => {
		const formData = await request.formData();
		const id = formData.get('id');
		const description = formData.get('description');
		const amount = formData.get('amount');

		if (!id || !description || !amount) {
			return fail(400, { error: 'Missing required fields' });
		}

		try {
			const response = await fetch(
				`${env.PUBLIC_BACKEND_URL}/api/groups/${params.groupId}/transactions/${id}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						description,
						amount: Math.round(parseFloat(amount as string) * 100)
					})
				}
			);

			if (!response.ok) {
				throw new Error('Failed to update transaction');
			}

			return { success: true };
		} catch (error) {
			return fail(500, {
				error: error instanceof Error ? error.message : 'Failed to update transaction'
			});
		}
	},

	delete: async ({ request, fetch, params }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		if (!id) {
			return fail(400, { error: 'Missing transaction ID' });
		}

		try {
			const response = await fetch(
				`${env.PUBLIC_BACKEND_URL}/api/groups/${params.groupId}/transactions/${id}`,
				{
					method: 'DELETE'
				}
			);

			if (!response.ok) {
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
