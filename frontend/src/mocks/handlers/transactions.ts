import { env } from '$env/dynamic/public';
import type { TransactionRead, TransactionUpdate } from '$lib/client';
import { http, HttpResponse } from 'msw';
import { bypassOrMock } from '../helpers/bypass-request';

const mockTransactions: TransactionRead[] = [
	{
		id: '1',
		amount: 3000,
		title: 'Dinner',
		created_at: '2024-03-20T12:00:00Z',
		updated_at: '2024-03-20T12:00:00Z',
		purchased_on: '2024-03-20T12:00:00Z',
		transaction_type: 'EVEN',
		group_id: 'group1',
		payer_id: 'john_id',
		payer: {
			id: 'john_id',
			username: 'John',
			email: 'john@example.com',
			password: '',
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z',
			email_verified: true
		},
		group: {
			id: 'group1',
			name: 'Test Group',
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z'
		},
		participants: [
			{
				id: 'part1',
				amount_owed: 1500,
				transaction_id: '1',
				debtor_id: 'jane_id',
				created_at: '2024-03-20T12:00:00Z',
				updated_at: '2024-03-20T12:00:00Z',
				debtor: {
					id: 'jane_id',
					username: 'Jane',
					email: 'jane@example.com',
					password: '',
					created_at: '2024-01-01T00:00:00Z',
					updated_at: '2024-01-01T00:00:00Z',
					email_verified: true
				}
			},
			{
				id: 'part2',
				amount_owed: 1500,
				transaction_id: '1',
				debtor_id: 'bob_id',
				created_at: '2024-03-20T12:00:00Z',
				updated_at: '2024-03-20T12:00:00Z',
				debtor: {
					id: 'bob_id',
					username: 'Bob',
					email: 'bob@example.com',
					password: '',
					created_at: '2024-01-01T00:00:00Z',
					updated_at: '2024-01-01T00:00:00Z',
					email_verified: true
				}
			}
		]
	},
	{
		id: '2',
		amount: 2000,
		title: 'Movie tickets',
		created_at: '2024-03-19T15:30:00Z',
		updated_at: '2024-03-19T15:30:00Z',
		purchased_on: '2024-03-19T15:30:00Z',
		transaction_type: 'EVEN',
		group_id: 'group1',
		payer_id: 'jane_id',
		payer: {
			id: 'jane_id',
			username: 'Jane',
			email: 'jane@example.com',
			password: '',
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z',
			email_verified: true
		},
		group: {
			id: 'group1',
			name: 'Test Group',
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z'
		},
		participants: [
			{
				id: 'part3',
				amount_owed: 1000,
				transaction_id: '2',
				debtor_id: 'john_id',
				created_at: '2024-03-19T15:30:00Z',
				updated_at: '2024-03-19T15:30:00Z',
				debtor: {
					id: 'john_id',
					username: 'John',
					email: 'john@example.com',
					password: '',
					created_at: '2024-01-01T00:00:00Z',
					updated_at: '2024-01-01T00:00:00Z',
					email_verified: true
				}
			},
			{
				id: 'part4',
				amount_owed: 1000,
				transaction_id: '2',
				debtor_id: 'bob_id',
				created_at: '2024-03-19T15:30:00Z',
				updated_at: '2024-03-19T15:30:00Z',
				debtor: {
					id: 'bob_id',
					username: 'Bob',
					email: 'bob@example.com',
					password: '',
					created_at: '2024-01-01T00:00:00Z',
					updated_at: '2024-01-01T00:00:00Z',
					email_verified: true
				}
			}
		]
	},
	{
		id: '3',
		amount: 1500,
		title: 'Drinks',
		created_at: '2024-03-18T20:00:00Z',
		updated_at: '2024-03-18T20:00:00Z',
		purchased_on: '2024-03-18T20:00:00Z',
		transaction_type: 'EVEN',
		group_id: 'group1',
		payer_id: 'bob_id',
		payer: {
			id: 'bob_id',
			username: 'Bob',
			email: 'bob@example.com',
			password: '',
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z',
			email_verified: true
		},
		group: {
			id: 'group1',
			name: 'Test Group',
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z'
		},
		participants: [
			{
				id: 'part5',
				amount_owed: 750,
				transaction_id: '3',
				debtor_id: 'john_id',
				created_at: '2024-03-18T20:00:00Z',
				updated_at: '2024-03-18T20:00:00Z',
				debtor: {
					id: 'john_id',
					username: 'John',
					email: 'john@example.com',
					password: '',
					created_at: '2024-01-01T00:00:00Z',
					updated_at: '2024-01-01T00:00:00Z',
					email_verified: true
				}
			},
			{
				id: 'part6',
				amount_owed: 750,
				transaction_id: '3',
				debtor_id: 'jane_id',
				created_at: '2024-03-18T20:00:00Z',
				updated_at: '2024-03-18T20:00:00Z',
				debtor: {
					id: 'jane_id',
					username: 'Jane',
					email: 'jane@example.com',
					password: '',
					created_at: '2024-01-01T00:00:00Z',
					updated_at: '2024-01-01T00:00:00Z',
					email_verified: true
				}
			}
		]
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
	({ request }) => {
		return bypassOrMock(request, HttpResponse.json(mockTransactions.length));
	}
);

export const updateTransactionMock = http.put(
	`${env.PUBLIC_BACKEND_URL}/api/groups/:groupId/transactions/:id`,
	async ({ request }) => {
		const body = (await request.json()) as TransactionUpdate;
		const id = request.url.split('/').pop() || '';

		const transaction = mockTransactions.find((t) => t.id === id);
		if (!transaction) {
			return new HttpResponse(null, { status: 404 });
		}

		if (body.title !== undefined && body.title !== null) transaction.title = body.title;
		if (body.amount !== undefined && body.amount !== null) transaction.amount = body.amount;

		return bypassOrMock(request, HttpResponse.json(transaction));
	}
);

export const deleteTransactionMock = http.delete(
	`${env.PUBLIC_BACKEND_URL}/api/groups/:groupId/transactions/:id`,
	({ request }) => {
		const id = request.url.split('/').pop() || '';
		const index = mockTransactions.findIndex((t) => t.id === id);

		if (index === -1) {
			return new HttpResponse(null, { status: 404 });
		}

		mockTransactions.splice(index, 1);
		return bypassOrMock(request, new HttpResponse(null, { status: 204 }));
	}
);
