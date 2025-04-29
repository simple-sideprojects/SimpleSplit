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
import { fail, redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

export async function load({ params }) {
	const { data: group } = await readGroupGroupsGroupIdGet({
		path: {
			group_id: params.groupId
		}
	});

	const inviteMemberForm = await superValidate(zod(zGroupInviteCreate));

	return {
		group,
		inviteMemberForm
	};
}

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
	},
	inviteMember: async ({ request, params }) => {
		const inviteMemberForm = await superValidate(
			request,
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
				group_id: params.groupId
			},
			body: {
				email: inviteMemberForm.data.email
			}
		}).catch(() => {
			return setError(inviteMemberForm, 'email', 'Failed to invite member');
		});

		const { data: updatedGroup } = await readGroupGroupsGroupIdGet({
			path: {
				group_id: params.groupId
			}
		});

		return {
			inviteMemberForm,
			group: updatedGroup
		};
	},
	generateInviteLink: async ({ params }) => {
		const { data: inviteData } = await generateInviteLinkInvitesGroupIdGeneratePost({
			path: {
				group_id: params.groupId
			}
		});

		if (!inviteData) {
			return fail(500, {
				error: 'Failed to generate invite link'
			});
		}

		const { data: updatedGroup } = await readGroupGroupsGroupIdGet({
			path: {
				group_id: params.groupId
			}
		});

		return {
			group: updatedGroup,
			invite: inviteData
		};
	},
	cancelInvite: async ({ request, params }) => {
		const data = await request.formData();
		const inviteToken = data.get('inviteToken')?.toString();

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
				group_id: params.groupId
			}
		});

		return {
			group: updatedGroup
		};
	},
	removeMember: async ({ request, params }) => {
		const data = await request.formData();
		const userId = data.get('userId')?.toString();

		if (!userId) {
			return fail(400, {
				error: 'User ID is required'
			});
		}

		const { data: updatedGroup } = await deleteUserFromGroupGroupsGroupIdUsersUserIdDelete({
			path: {
				group_id: params.groupId,
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
