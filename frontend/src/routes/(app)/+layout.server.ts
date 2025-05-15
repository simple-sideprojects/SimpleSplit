import { getRootLayoutData } from '$lib/server/layout-data';
import type { LayoutServerLoad } from './$types';
import { building } from '$app/environment';
import { zod } from 'sveltekit-superforms/adapters';
import { superValidate } from 'sveltekit-superforms';
import { zTransactionCreate } from '$lib/client/zod.gen';

export const load: LayoutServerLoad = async ({ cookies }) => {
    if (building){
        const transactionForm = await superValidate(zod(zTransactionCreate));
        return {
            user: null,
            groups: null,
            transactionForm
        };
    }

    return getRootLayoutData(cookies);
};
