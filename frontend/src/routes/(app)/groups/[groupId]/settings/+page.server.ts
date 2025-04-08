import { deleteGroupGroupsGroupIdDelete, updateGroupGroupsGroupIdPut } from '$lib/client';
import { zUpdateGroup } from '$lib/client/zod.gen';
import { redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const actions = {
	updateGroupName: async ({ request, params }) => {
		const form = await superValidate(request, zod(zUpdateGroup));

		if (!form.valid) {
			return setError(form, 'name', 'Name is required');
		}

		await updateGroupGroupsGroupIdPut({
			path: {
				group_id: params.groupId
			},
			body: {
				name: form.data.name
			}
		});

		return {
			form
		};
	},
	deleteGroup: async ({ params }) => {
		await deleteGroupGroupsGroupIdDelete({
			path: {
				group_id: params.groupId
			}
		});

		return redirect(303, '/');
	}
};
