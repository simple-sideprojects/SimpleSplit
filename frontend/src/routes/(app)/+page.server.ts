import { env } from '$env/dynamic/public';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const [balanceRes, recentRes] = await Promise.all([
		fetch(`${env.PUBLIC_BACKEND_URL}/api/balance`),
		fetch(`${env.PUBLIC_BACKEND_URL}/api/recent`)
	]);

	const [balances, transactions] = await Promise.all([balanceRes.json(), recentRes.json()]);

	return {
		balances,
		transactions
	};
};
