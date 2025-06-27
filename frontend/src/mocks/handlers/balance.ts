import { env } from '$env/dynamic/public';
import { http, HttpResponse } from 'msw';
import { bypassOrMock } from '../helpers/bypass-request';

export const balanceMock = http.get(`${env.PUBLIC_BACKEND_URL}/balances/`, async ({ request }) => {
	return bypassOrMock(
		request,
		HttpResponse.json({
			user_id: '112-123-311',
			group_id: null,
			total_balance: 17800, // 178.00
			total_owed_to_others: 6700, // 67.00
			total_owed_by_others: 24500, // 245.00
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
					balance: 15000 // 150.00
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
					balance: 7800 // 78.00
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
					balance: -4200 // -42.00
				}
			]
		})
	);
});
