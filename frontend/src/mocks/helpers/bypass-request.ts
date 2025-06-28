import { env } from '$env/dynamic/public';
import { bypass, HttpResponse } from 'msw';

export const bypassOrMock = async (request: Request, mockResponse: HttpResponse) => {
	const realResponse = await fetch(bypass(request));
	if (env.PUBLIC_MOCK_MODE === 'off') {
		return realResponse;
	}

	if (env.PUBLIC_MOCK_MODE === 'auto' && realResponse.ok) {
		return realResponse;
	}

	if (realResponse.status === 401) {
		return realResponse;
	}

	return mockResponse;
};
