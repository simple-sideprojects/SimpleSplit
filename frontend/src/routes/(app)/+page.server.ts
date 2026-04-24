import { createTransactionTransactionsPost } from '$lib/client';
import { zTransactionCreate } from '$lib/client/zod.gen';
import { fail } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';
import { setMessage, superValidate, type SuperValidated } from 'sveltekit-superforms/server';
import type { ActionFailure, Actions } from '@sveltejs/kit';
import type { z } from 'zod';

/**
 * The add-transaction dialog still submits through a SvelteKit action while
 * its SuperForms wrapper is on the Phase 3 list. Once that component is
 * converted to an SDK mutation, this file can disappear.
 */
export const actions: Actions = {
	createTransaction: async ({
		request,
		locals
	}): Promise<
		| { form: SuperValidated<z.infer<typeof zTransactionCreate>> }
		| ActionFailure<{ form: SuperValidated<z.infer<typeof zTransactionCreate>> }>
	> => {
		const form = await superValidate(request, zod(zTransactionCreate));

		if (!form.valid) {
			return fail(400, { form });
		}

		const response = await createTransactionTransactionsPost({
			client: locals.api,
			body: form.data
		});

		if (!response.data) {
			setMessage(form, 'An unexpected error occurred during transaction creation.');
			return fail(500, { form });
		}

		return { form };
	}
};
