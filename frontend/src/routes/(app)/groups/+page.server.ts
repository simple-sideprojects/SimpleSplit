import { env } from '$env/dynamic/public';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const response = await fetch(`${env.PUBLIC_BACKEND_URL}/api/groups`);
	const groups = await response.json();

	return {
		groups
	};
};
