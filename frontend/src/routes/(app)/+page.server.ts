import { env } from '$env/dynamic/public';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const [balanceRes, recentRes] = await Promise.all([
		fetch(`${env.PUBLIC_BACKEND_URL}/balance`),
		fetch(`${env.PUBLIC_BACKEND_URL}/recent`)
	]);

	const [balances, transactions] = await Promise.all([balanceRes.json(), recentRes.json()]);

	return {
		balances,
		transactions
	};
};
