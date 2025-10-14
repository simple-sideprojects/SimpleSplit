import { createGroupGroupsPost } from '$lib/client';
import { fail, redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions } from '@sveltejs/kit';
import { zCreateGroup } from '$lib/shared/form/validators';

export const actions: Actions = {
	createGroup: async ({ request }) => {
		const form = await superValidate(request, zod(zCreateGroup));

		if (!form.valid) {
			setError(form, 'name', 'Name is required');
			return fail(400, { form });
		}

		const response = await createGroupGroupsPost({
			body: {
				name: form.data.name
			}
		});

		if (response.error) {
			return fail(400, { form });
		}

		throw redirect(303, `/groups/dashboard/?groupId=${response.data.id}`);
	}
};
