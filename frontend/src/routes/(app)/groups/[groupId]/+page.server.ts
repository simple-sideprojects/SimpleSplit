import { env } from '$env/dynamic/public';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const [balanceRes, recentRes] = await Promise.all([
		fetch(`${env.PUBLIC_BACKEND_URL}/groups/${params.groupId}/balance`),
		fetch(`${env.PUBLIC_BACKEND_URL}/groups/${params.groupId}/recent`)
	]);

	const [balances, transactions] = await Promise.all([balanceRes.json(), recentRes.json()]);

	return {
		balances,
		transactions
	};
};
