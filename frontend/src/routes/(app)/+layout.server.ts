import { readGroupsGroupsGet, readUsersMeAccountGet } from '$lib/client';
import { zTransactionCreate } from '$lib/client/zod.gen';
import { redirect } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';
import { superValidate } from 'sveltekit-superforms/server';
import type { LayoutServerLoad } from './$types';


export const load: LayoutServerLoad = async ({ cookies }) => {
	const userResponse = await readUsersMeAccountGet();
	const groupsResponse = await readGroupsGroupsGet();

	if (!userResponse.data) {
		cookies.delete('auth_token', { path: '/' });
		return redirect(302, '/auth/login');
	}

	const transactionForm = await superValidate(zod(zTransactionCreate));

	return {
		user: userResponse.data,
		groups: groupsResponse.data ?? [],
		transactionForm
	};
};
