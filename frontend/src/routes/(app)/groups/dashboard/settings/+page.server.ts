import { isCompiledStatic } from '$lib/shared/app/controller';
import type { Actions, PageServerLoad } from './$types';
import {
	deleteGroupGroupsGroupIdDelete,
	deleteUserFromGroupGroupsGroupIdUsersUserIdDelete,
	generateInviteLinkInvitesGroupIdGeneratePost,
	inviteByEmailInvitesGroupIdEmailPost,
	readGroupGroupsGroupIdGet,
	rejectInviteInvitesRejectTokenDelete,
	updateGroupGroupsGroupIdPut
} from '$lib/client';
import { zGroupInviteCreate, zUpdateGroup } from '$lib/client/zod.gen';
import { error, fail, redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { building } from '$app/environment';

async function getPageData() {
	const inviteMemberForm = await superValidate(zod(zGroupInviteCreate));

	return {
		inviteMemberForm
	};
}

export const load: PageServerLoad = async ({ params }) => {
	if (building){
		const inviteMemberForm = await superValidate(zod(zGroupInviteCreate));

		return {
			inviteMemberForm: inviteMemberForm
		};
	}
	
	return getPageData();
};

export const actions: Actions|undefined = isCompiledStatic() ? undefined : {
	data: async () => {
		return getPageData();
	},
	updateGroupName: async ({ request }) => {
		const raw_data = await request.formData();
		const groupId = raw_data.get('groupId');

		if (!groupId) {
			return fail(400, {
				error: 'Group ID is required'
			});
		}

		const form = await superValidate(raw_data, zod(zUpdateGroup));

		if (!form.valid) {
			return setError(form, 'name', 'Name is required');
		}

		await updateGroupGroupsGroupIdPut({
			path: {
				group_id: groupId as string
			},
			body: {
				name: form.data.name
			}
		});

		const groupResponse = await readGroupGroupsGroupIdGet({
			path: {
				group_id: groupId as string
			}
		});

		if(groupResponse.error){
			if(groupResponse.response.status === 401){
				return redirect(302, '/auth/login');
			}
			return error(500, {
				message: groupResponse.error
			});
		}
	
		if (!groupResponse.data) {
			throw redirect(302, '/');
		}

		return {
			form,
			group: groupResponse.data
		};
	},
	deleteGroup: async ({ request }) => {
		const raw_data = await request.formData();
		const groupId = raw_data.get('groupId');

		if (!groupId) {
			return fail(400, {
				error: 'Group ID is required'
			});
		}
		await deleteGroupGroupsGroupIdDelete({
			path: {
				group_id: groupId as string
			}
		});

		return redirect(303, '/');
	},
	inviteMember: async ({ request }) => {
		const raw_data = await request.formData();
		const groupId = raw_data.get('groupId');

		if (!groupId) {
			return fail(400, {
				error: 'Group ID is required'
			});
		}
		const inviteMemberForm = await superValidate(
			raw_data,
			zod(
				z.object({
					email: z.string().email()
				})
			)
		);

		if (!inviteMemberForm.valid) {
			return setError(inviteMemberForm, 'email', 'A valid email is required');
		}

		await inviteByEmailInvitesGroupIdEmailPost({
			path: {
				group_id: groupId as string
			},
			body: {
				email: inviteMemberForm.data.email
			}
		}).catch(() => {
			return setError(inviteMemberForm, 'email', 'Failed to invite member');
		});

		const { data: updatedGroup } = await readGroupGroupsGroupIdGet({
			path: {
				group_id: groupId as string
			}
		});

		return {
			inviteMemberForm,
			group: updatedGroup
		};
	},
	generateInviteLink: async ({ request }) => {
		const raw_data = await request.formData();
		const groupId = raw_data.get('groupId');

		if (!groupId) {
			return fail(400, {
				error: 'Group ID is required'
			});
		}
		const { data: inviteData } = await generateInviteLinkInvitesGroupIdGeneratePost({
			path: {
				group_id: groupId as string
			}
		});

		if (!inviteData) {
			return fail(500, {
				error: 'Failed to generate invite link'
			});
		}

		const { data: updatedGroup } = await readGroupGroupsGroupIdGet({
			path: {
				group_id: groupId as string
			}
		});

		return {
			group: updatedGroup,
			invite: inviteData
		};
	},
	cancelInvite: async ({ request }) => {
		const raw_data = await request.formData();
		const groupId = raw_data.get('groupId');

		if (!groupId) {
			return fail(400, {
				error: 'Group ID is required'
			});
		}
		const inviteToken = raw_data.get('inviteToken')?.toString();

		if (!inviteToken) {
			return fail(400, {
				error: 'Invite token is required'
			});
		}

		const { data: rejectionResponse } = await rejectInviteInvitesRejectTokenDelete({
			path: {
				token: inviteToken
			}
		});

		console.log(rejectionResponse);

		if (!rejectionResponse) {
			return fail(500, {
				error: 'Failed to cancel invitation'
			});
		}

		const { data: updatedGroup } = await readGroupGroupsGroupIdGet({
			path: {
				group_id: groupId as string
			}
		});

		return {
			group: updatedGroup
		};
	},
	removeMember: async ({ request }) => {
		const raw_data = await request.formData();
		const groupId = raw_data.get('groupId');
		const userId = raw_data.get('userId')?.toString();

		if (!groupId) {
			return fail(400, {
				error: 'Group ID is required'
			});
		}

		if (!userId) {
			return fail(400, {
				error: 'User ID is required'
			});
		}

		const { data: updatedGroup } = await deleteUserFromGroupGroupsGroupIdUsersUserIdDelete({
			path: {
				group_id: groupId as string,
				user_id: userId
			}
		}).catch(() => {
			return fail(500, {
				error: 'Failed to remove member'
			});
		});

		return {
			group: updatedGroup,
			success: true
		};
	}
};
