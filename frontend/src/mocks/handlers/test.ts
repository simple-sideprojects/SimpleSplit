import { http, HttpResponse } from 'msw';
import { bypassOrMock } from '../helpers/bypass-request';

export const testMock = http.get('/api', async ({ request }) => {
	return bypassOrMock(
		request,
		HttpResponse.json({
			id: 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b3d',
			firstName: 'John',
			lastName: 'Maverick'
		})
	);
});
