import { isCompiledStatic } from '$lib/shared/app/controller';
import { createGroupGroupsPost } from '$lib/client';
import { redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { building } from '$app/environment';

const zCreateGroup = z.object({
	name: z.string().min(1)
});

async function getPageData(request: Request) {
	const groupCreateForm = await superValidate(request, zod(zCreateGroup));
	
	return {
		groupCreateForm
	};
};

export const load: PageServerLoad = async ({ request }) => {
	if (building){
		return getPageData(request);
	}
	
	return getPageData(request);
};

export const actions: Actions|undefined = isCompiledStatic() ? undefined : {
	data: async ({ request }) => {
		return getPageData(request);
	},
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
