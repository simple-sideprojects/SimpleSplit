import { env } from '$env/dynamic/public';
import { http, HttpResponse } from 'msw';
import { bypassOrMock } from '../helpers/bypass-request';

const groups = [
	{
		id: 1,
		name: '🍝 Vacation Italy 2024',
		members: ['Max Mustermann', 'Anna Schmidt', 'Thomas Weber', 'Lisa Meyer'],
		created_at: '2024-03-01T10:00:00Z'
	},
	{
		id: 2,
		name: '🏠 Shared Apartment',
		members: ['Max Mustermann', 'Michael Bauer'],
		created_at: '2024-02-15T14:30:00Z'
	},
	{
		id: 3,
		name: '🎲 Board Game Night',
		members: ['Max Mustermann', 'Anna Schmidt', 'Lisa Meyer'],
		created_at: '2024-01-20T19:00:00Z'
	}
];

// Create group balance mocks using the new Balance structure
const groupsBalanceMap = new Map();
groupsBalanceMap.set('1', {
	user_id: '112-123-311',
	group_id: '1',
	total_balance: 15100, // 151.00
	total_owed_to_others: 3600, // 36.00
	total_owed_by_others: 18700, // 187.00
	user_balances: [
		{
			user: {
				id: '112-123-312',
				email: 'anna@example.com',
				username: 'Anna Schmidt',
				email_verified: true,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z'
			},
			balance: 5000 // 50.00
		},
		{
			user: {
				id: '112-123-313',
				email: 'thomas@example.com',
				username: 'Thomas Weber',
				email_verified: true,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z'
			},
			balance: -1500 // -15.00
		},
		{
			user: {
				id: '112-123-314',
				email: 'lisa@example.com',
				username: 'Lisa Meyer',
				email_verified: true,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z'
			},
			balance: 2800 // 28.00
		},
		{
			user: {
				id: '112-123-315',
				email: 'michael@example.com',
				username: 'Michael Bauer',
				email_verified: true,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z'
			},
			balance: -1200 // -12.00
		}
	]
});

groupsBalanceMap.set('2', {
	user_id: '112-123-311',
	group_id: '2',
	total_balance: 4800, // 48.00
	total_owed_to_others: 1000, // 10.00
	total_owed_by_others: 5800, // 58.00
	user_balances: [
		{
			user: {
				id: '112-123-311',
				email: 'max@example.com',
				username: 'Max Mustermann',
				email_verified: true,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z'
			},
			balance: 10000 // 100.00
		},
		{
			user: {
				id: '112-123-315',
				email: 'michael@example.com',
				username: 'Michael Bauer',
				email_verified: true,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z'
			},
			balance: -5000 // -50.00
		}
	]
});

groupsBalanceMap.set('3', {
	user_id: '112-123-311',
	group_id: '3',
	total_balance: 4900, // 49.00
	total_owed_to_others: 1500, // 15.00
	total_owed_by_others: 6400, // 64.00
	user_balances: [
		{
			user: {
				id: '112-123-311',
				email: 'max@example.com',
				username: 'Max Mustermann',
				email_verified: true,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z'
			},
			balance: 7000 // 70.00
		},
		{
			user: {
				id: '112-123-312',
				email: 'anna@example.com',
				username: 'Anna Schmidt',
				email_verified: true,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z'
			},
			balance: -2500 // -25.00
		},
		{
			user: {
				id: '112-123-314',
				email: 'lisa@example.com',
				username: 'Lisa Meyer',
				email_verified: true,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z'
			},
			balance: 1400 // 14.00
		},
		{
			user: {
				id: '112-123-313',
				email: 'thomas@example.com',
				username: 'Thomas Weber',
				email_verified: true,
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z'
			},
			balance: -1000 // -10.00
		}
	]
});

export const groupsMock = http.get(`${env.PUBLIC_BACKEND_URL}/groups`, async ({ request }) => {
	return bypassOrMock(request, HttpResponse.json(groups));
});

export const groupByIdMock = http.get(
	`${env.PUBLIC_BACKEND_URL}/groups/:groupId`,
	async ({ params, request }) => {
		return bypassOrMock(
			request,
			HttpResponse.json(groups.find((group) => group.id === Number(params.groupId)))
		);
	}
);

export const createGroupMock = http.post(
	`${env.PUBLIC_BACKEND_URL}/api/groups`,
	async ({ request }) => {
		return bypassOrMock(
			request,
			HttpResponse.json({
				id: 4,
				name: request.formData.name,
				members: ['Max Mustermann'],
				created_at: new Date().toISOString()
			})
		);
	}
);

export const updateGroupMock = http.put(
	`${env.PUBLIC_BACKEND_URL}/groups/:groupId`,
	async ({ params, request }) => {
		return bypassOrMock(
			request,
			HttpResponse.json(groups.find((group) => group.id === Number(params.groupId)))
		);
	}
);

export const deleteGroupMock = http.delete(
	`${env.PUBLIC_BACKEND_URL}/groups/:groupId`,
	async ({ params, request }) => {
		return bypassOrMock(
			request,
			HttpResponse.json(groups.find((group) => group.id === Number(params.groupId)))
		);
	}
);

export const balanceByGroupMock = http.get(
	`${env.PUBLIC_BACKEND_URL}/groups/:groupId/balance`,
	async ({ params }) => {
		const groupId = params.groupId as string;
		return HttpResponse.json(groupsBalanceMap.get(groupId) || groupsBalanceMap.get('1'));
	}
);

export const addGroupMemberMock = http.post(
	`${env.PUBLIC_BACKEND_URL}/groups/:groupId/members`,
	async ({ params, request }) => {
		const group = groups.find((g) => g.id === Number(params.groupId));
		if (!group) {
			return new HttpResponse(null, { status: 404 });
		}

		const body = (await request.json()) as { username: string };
		if (group.members.includes(body.username)) {
			return new HttpResponse(null, {
				status: 400,
				statusText: 'Member already exists in group'
			});
		}

		group.members.push(body.username);
		return bypassOrMock(request, HttpResponse.json(group));
	}
);

export const removeGroupMemberMock = http.delete(
	`${env.PUBLIC_BACKEND_URL}/groups/:groupId/members/:username`,
	async ({ params, request }) => {
		const group = groups.find((g) => g.id === Number(params.groupId));
		if (!group) {
			return new HttpResponse(null, { status: 404 });
		}

		const username = params.username as string;
		if (!username) {
			return new HttpResponse(null, {
				status: 400,
				statusText: 'Username is required'
			});
		}

		const memberIndex = group.members.indexOf(username);
		if (memberIndex === -1) {
			return new HttpResponse(null, {
				status: 400,
				statusText: 'Member not found in group'
			});
		}

		group.members.splice(memberIndex, 1);
		return bypassOrMock(request, HttpResponse.json(group));
	}
);

export const recentByGroupMock = http.get(
	`${env.PUBLIC_BACKEND_URL}/groups/:groupId/recent`,
	async ({ request }) => {
		return bypassOrMock(
			request,
			HttpResponse.json([
				{
					id: 1,
					from: 'Max Mustermann',
					to: ['Anna Schmidt', 'Thomas Weber'],
					amount: 3600, // 36.00
					description: 'Dinner at Italian Restaurant',
					date: '2024-03-15T19:30:00Z'
				},
				{
					id: 2,
					from: 'Lisa Meyer',
					to: ['Max Mustermann'],
					amount: 2500, // 25.00
					description: 'Movie tickets',
					date: '2024-03-14T20:00:00Z'
				},
				{
					id: 3,
					from: 'Thomas Weber',
					to: ['Max Mustermann', 'Anna Schmidt', 'Michael Bauer'],
					amount: 9000, // 90.00
					description: 'Group gift for Lisa',
					date: '2024-03-12T14:20:00Z'
				}
			])
		);
	}
);
