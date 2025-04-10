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

const groupsBalanceMap = new Map();
groupsBalanceMap.set('1', [
	{ username: 'Anna Schmidt', balance: 5000 }, // 50.00
	{ username: 'Thomas Weber', balance: -1500 }, // -15.00
	{ username: 'Lisa Meyer', balance: 2800 }, // 28.00
	{ username: 'Michael Bauer', balance: -1200 } // -12.00
]);
groupsBalanceMap.set('2', [
	{ username: 'Max Mustermann', balance: 10000 }, // 100.00
	{ username: 'Michael Bauer', balance: -5000 }, // -50.00
	{ username: 'Lisa Meyer', balance: 2800 }, // 28.00
	{ username: 'Thomas Weber', balance: -1200 }, // -12.00
	{ username: 'Anna Schmidt', balance: 5000 } // 50.00
]);
groupsBalanceMap.set('3', [
	{ username: 'Max Mustermann', balance: 7000 }, // 70.00
	{ username: 'Anna Schmidt', balance: -2500 }, // -50.00
	{ username: 'Lisa Meyer', balance: 1400 }, // 28.00
	{ username: 'Thomas Weber', balance: -1000 } // -10.00
]);

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
	async ({ request }) => {
		return bypassOrMock(request, HttpResponse.json(groupsBalanceMap.get('1')));
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
		return HttpResponse.json(group);
	}
);

export const removeGroupMemberMock = http.delete(
	`${env.PUBLIC_BACKEND_URL}/groups/:groupId/members/:username`,
	({ params }) => {
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
		return HttpResponse.json(group);
	}
);

export const recentByGroupMock = http.get(
	`${env.PUBLIC_BACKEND_URL}/groups/:groupId/recent`,
	() => {
		return HttpResponse.json([
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
		]);
	}
);
