import { createGroupGroupsPost } from '$lib/client';
import { redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

const zCreateGroup = z.object({
	name: z.string().min(1)
});

export const actions = {
	createGroup: async ({ request }) => {
		const groupCreateForm = await superValidate(request, zod(zCreateGroup));

		if (!groupCreateForm.valid) {
			return setError(groupCreateForm, 'name', 'Name is required');
		}

		const response = await createGroupGroupsPost({
			body: {
				name: groupCreateForm.data.name
			}
		});

		if (response.error) {
			return {
				groupCreateForm
			};
		}

		redirect(303, `/groups/${response.data.id}`);
	}
};

export const load = async ({ request }) => {
	const groupCreateForm = await superValidate(request, zod(zCreateGroup));

	return {
		groupCreateForm
	};
};
