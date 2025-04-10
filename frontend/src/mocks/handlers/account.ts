import { env } from '$env/dynamic/public';
import { http, HttpResponse } from 'msw';
import { bypassOrMock } from '../helpers/bypass-request';

export const getAccountMock = http.get(`${env.PUBLIC_BACKEND_URL}/account`, async ({ request }) => {
	return bypassOrMock(
		request,
		HttpResponse.json({
			username: 'Max Mockstermann',
			email: 'max@mockstermann.de',
			balance: 1000,
			created_at: '2024-01-01T00:00:00Z'
		})
	);
});
