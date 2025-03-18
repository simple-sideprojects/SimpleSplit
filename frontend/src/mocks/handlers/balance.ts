import { env } from '$env/dynamic/public';
import { http, HttpResponse } from 'msw';

export const balanceMock = http.get(`${env.PUBLIC_BACKEND_URL}/api/balance`, () => {
	return HttpResponse.json([
		{ username: 'Anna Schmidt', balance: 15000 }, // 150.00
		{ username: 'Thomas Weber', balance: -2500 }, // -25.00
		{ username: 'Lisa Meyer', balance: 7800 }, // 78.00
		{ username: 'Michael Bauer', balance: -4200 } // -42.00
	]);
});
