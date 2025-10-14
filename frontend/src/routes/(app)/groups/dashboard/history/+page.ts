import { building } from '$app/environment';
import { env } from '$env/dynamic/public';
import { readGroupTransactionsGroupsGroupIdTransactionsGet } from '$lib/client';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url, fetch, parent }) => {
	// For static builds, return empty data
	if (building) {
		return {
			groupId: null,
			transactions: [],
			total: 0,
			page: 1,
			limit: 25,
			totalPages: 1
		};
	}

	await parent();

	const groupId = url.searchParams.get('groupId');
	if (!groupId) {
		throw redirect(303, '/groups');
	}

	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '25');

	// Use the generated OpenAPI function for transactions
	const transactionsResponse = await readGroupTransactionsGroupsGroupIdTransactionsGet({
		path: {
			group_id: groupId
		},
		query: {
			skip: (page - 1) * limit,
			limit: limit
		}
	});

	// Still need to fetch total count from local API since it's not in the generated client
	const totalRes = await fetch(`${env.PUBLIC_BACKEND_URL}/api/groups/${groupId}/transactions/total`);
	const total = await totalRes.json();

	if (transactionsResponse.error) {
		throw new Error('Failed to fetch transactions');
	}

	return {
		groupId: groupId,
		transactions: transactionsResponse.data || [],
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit)
	};
};

