import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
	// Add your authentication check here
	const isAuthenticated = true; // TODO: Replace with actual auth check

	if (!isAuthenticated) {
		throw redirect(303, '/login');
	}

	return {};
};
