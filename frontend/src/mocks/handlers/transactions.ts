import { env } from '$env/dynamic/public';
import type { ITransaction, UpdateTransactionBody } from '$lib/interfaces/transactions';
import { http, HttpResponse } from 'msw';
import { bypassOrMock } from '../helpers/bypass-request';

const mockTransactions: ITransaction[] = [
	{
		id: 1,
		from: 'John',
		to: ['Jane', 'Bob'],
		amount: 3000,
		description: 'Dinner',
		date: '2024-03-20T12:00:00Z'
	},
	{
		id: 2,
		from: 'Jane',
		to: ['John', 'Bob'],
		amount: 2000,
		description: 'Movie tickets',
		date: '2024-03-19T15:30:00Z'
	},
	{
		id: 3,
		from: 'Bob',
		to: ['John', 'Jane'],
		amount: 1500,
		description: 'Drinks',
		date: '2024-03-18T20:00:00Z'
	}
];

export const getTransactionsMock = http.get(
	`${env.PUBLIC_BACKEND_URL}/api/groups/:groupId/transactions`,
	({ request }) => {
		const url = new URL(request.url);
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '25');

		const start = (page - 1) * limit;
		const end = start + limit;
		const paginatedTransactions = mockTransactions.slice(start, end);

		return bypassOrMock(request, HttpResponse.json(paginatedTransactions));
	}
);

export const getTotalTransactionsMock = http.get(
	`${env.PUBLIC_BACKEND_URL}/api/groups/:groupId/transactions/total`,
	() => {
		return bypassOrMock(request, HttpResponse.json(mockTransactions.length));
	}
);

export const updateTransactionMock = http.put(
	`${env.PUBLIC_BACKEND_URL}/api/groups/:groupId/transactions/:id`,
	async ({ request }) => {
		const body = (await request.json()) as UpdateTransactionBody;
		const id = parseInt(request.url.split('/').pop() || '0');

		const transaction = mockTransactions.find((t) => t.id === id);
		if (!transaction) {
			return new HttpResponse(null, { status: 404 });
		}

		transaction.description = body.description;
		transaction.amount = body.amount;

		return bypassOrMock(request, HttpResponse.json(transaction));
	}
);

export const deleteTransactionMock = http.delete(
	`${env.PUBLIC_BACKEND_URL}/api/groups/:groupId/transactions/:id`,
	({ request }) => {
		const id = parseInt(request.url.split('/').pop() || '0');
		const index = mockTransactions.findIndex((t) => t.id === id);

		if (index === -1) {
			return new HttpResponse(null, { status: 404 });
		}

		mockTransactions.splice(index, 1);
		return bypassOrMock(request, new HttpResponse(null, { status: 204 }));
	}
);
