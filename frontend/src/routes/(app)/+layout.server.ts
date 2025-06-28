import { building } from '$app/environment';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	//If svelte is precompiling, return empty object
	if (building) {
		return {
			authToken: null
		};
	}

	const token = cookies.get('auth_token');

	return {
		authToken: token
	};
};
