import { env } from '$env/dynamic/public';
import { http, HttpResponse } from 'msw';
import { bypassOrMock } from '../helpers/bypass-request';

export const balanceMock = http.get(`${env.PUBLIC_BACKEND_URL}/balance`, ({ request }) => {
	return HttpResponse.json([
		{ user_id: '112-123-312', username: 'Anna Schmidt', balance: 15000 }, // 150.00
		{ user_id: '112-123-313', username: 'Thomas Weber', balance: -2500 }, // -25.00
		{ user_id: '112-123-314', username: 'Lisa Meyer', balance: 7800 }, // 78.00
		{ user_id: '112-123-315', username: 'Michael Bauer', balance: -4200 } // -42.00
	]);
});
