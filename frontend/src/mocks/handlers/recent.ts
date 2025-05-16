import { env } from '$env/dynamic/public';
import { http, HttpResponse } from 'msw';
import { bypassOrMock } from '../helpers/bypass-request';

export const recentMock = http.get(`${env.PUBLIC_BACKEND_URL}/recent`, async ({ request }) => {
	return bypassOrMock(request, HttpResponse.json([
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
		},
		{
			id: 4,
			from: 'Max Mustermann',
			to: ['Michael Bauer'],
			amount: 1500, // 15.00
			description: 'Coffee and cake',
			date: '2024-03-10T15:45:00Z'
		},
		{
			id: 5,
			from: 'Anna Schmidt',
			to: ['Max Mustermann'],
			amount: 5000, // 50.00
			description: 'Concert tickets',
			date: '2024-03-08T09:15:00Z'
		}
	]));
});
