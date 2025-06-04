import { isCompiledStatic } from '$lib/shared/app/controller';
import { createGroupGroupsPost } from '$lib/client';
import { fail, redirect } from '@sveltejs/kit';
import { setError, superValidate, type SuperValidated } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import type { ActionFailure, Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { building } from '$app/environment';
import { zCreateGroup } from '$lib/shared/form/validators';

async function getPageData(request: Request) {
	const groupCreateForm = await superValidate(request, zod(zCreateGroup));
	
	return {
		groupCreateForm
	};
};

export const load: PageServerLoad = async ({ request }) => {
	//If svelte is precompiling, return only the validator
	if (building){
		return {
			groupCreateForm: await superValidate(request, zod(zCreateGroup))
		};
	}
	
	return getPageData(request);
};

export const actions: Actions|undefined = isCompiledStatic() ? undefined : {
	data: async ({ request }): Promise<{
		groupCreateForm: SuperValidated<z.infer<typeof zCreateGroup>>
	}> => {
		return getPageData(request);
	},
	createGroup: async ({ request }): Promise<ActionFailure<{
		form: SuperValidated<z.infer<typeof zCreateGroup>>
	}>> => {
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

		redirect(303, `/groups/dashboard/?groupId=${response.data.id}`);
	}
};
