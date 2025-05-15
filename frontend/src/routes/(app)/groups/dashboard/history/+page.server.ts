import { env } from '$env/dynamic/public';
import { fail, redirect, type Action } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { isCompiledStatic } from '$lib/shared/app/controller';
import { building } from '$app/environment';

async function getPageData(fetch: Fetch, page: number, limit: number, groupId: string) {
	const [transactionsRes, totalRes] = await Promise.all([
		fetch(
			`${env.PUBLIC_BACKEND_URL}/api/groups/${groupId}/transactions?page=${page}&limit=${limit}`
		),
		fetch(`${env.PUBLIC_BACKEND_URL}/api/groups/${groupId}/transactions/total`)
	]);

	const [transactions, total] = await Promise.all([transactionsRes.json(), totalRes.json()]);

	return {
		groupId: groupId,
		transactions,
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit)
	};
};

export const load: PageServerLoad = async ({ fetch, url }) => {
	if (building){
		return {
			groupId: null,
			transactions: [],
			total: 0,
			page: 1,
			limit: 25,
			totalPages: 1
		};
	}

	const groupId = url.searchParams.get('groupId');
	if (!groupId) {
		throw redirect(303, '/groups');
	}

	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '25');

	return getPageData(fetch, page, limit, groupId);
};

export const actions: Actions|undefined = isCompiledStatic() ? undefined : {
	data: async ({ request, fetch }) => {
		const formData = await request.formData();
		const groupId = formData.get('groupId');

		if (!groupId) {
			throw redirect(303, '/groups');
		}

		const page = parseInt(formData.get('page') as string || '1');
		const limit = parseInt(formData.get('limit') as string || '25');

		return getPageData(fetch, page, limit, groupId as string);
	},
	edit: async ({ request, fetch }) => {
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
			const response = await fetch(
				`${env.PUBLIC_BACKEND_URL}/api/groups/${groupId}/transactions/${id}`,
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
	delete: async ({ request, fetch }) => {
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
			const response = await fetch(
				`${env.PUBLIC_BACKEND_URL}/api/groups/${groupId}/transactions/${id}`,
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
