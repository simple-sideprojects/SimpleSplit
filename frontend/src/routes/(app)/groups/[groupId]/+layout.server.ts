import { env } from '$env/dynamic/public';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ fetch, params }) => {
	const response = await fetch(`${env.PUBLIC_BACKEND_URL}/api/groups/${params.groupId}`);
	const group = await response.json();

	return {
		group
	};
};
