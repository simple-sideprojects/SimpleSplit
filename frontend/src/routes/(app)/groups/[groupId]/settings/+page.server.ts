import {
	deleteGroupGroupsGroupIdDelete,
	deleteUserFromGroupGroupsGroupIdUsersUserIdDelete,
	inviteByEmailInvitesGroupIdEmailPost,
	readGroupGroupsGroupIdGet,
	rejectInviteInvitesRejectTokenDelete,
	updateGroupGroupsGroupIdPut
} from '$lib/client';
import { zGroupInviteCreate, zUpdateGroup } from '$lib/client/zod.gen';
import { fail, redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

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

		throw redirect(303, '/');
	},
	inviteMember: async ({ request, params }) => {
		const form = await superValidate(request, zod(zGroupInviteCreate));

		if (!form.valid) {
			return fail(400, {
				form,
				error: 'Email is required'
			});
		}

		await inviteByEmailInvitesGroupIdEmailPost({
			path: {
				group_id: params.groupId
			},
			body: {
				email: form.data.email
			}
		}).catch(() => {
			return setError(form, 'email', 'Failed to invite member');
		});

		// Fetch updated group data with the new invitation
		const { data: updatedGroup } = await readGroupGroupsGroupIdGet({
			path: {
				group_id: params.groupId
			}
		});

		// Reset form for next use
		const newForm = await superValidate(zod(zGroupInviteCreate));

		return {
			inviteMemberForm: newForm,
			group: updatedGroup,
			success: true
		};
	},
	cancelInvite: async ({ request, params }) => {
		const data = await request.formData();
		const inviteId = data.get('inviteId')?.toString();

		if (!inviteId) {
			return fail(400, {
				error: 'Invite ID is required'
			});
		}

		// Find the invite token using the inviteId
		const { data: group } = await readGroupGroupsGroupIdGet({
			path: {
				group_id: params.groupId
			}
		});

		const invite = group?.invites?.find((inv) => inv.id === inviteId);

		if (!invite) {
			return fail(404, {
				error: 'Invite not found'
			});
		}

		// Reject the invite using the token
		await rejectInviteInvitesRejectTokenDelete({
			path: {
				token: invite.token
			}
		}).catch(() => {
			return fail(500, {
				error: 'Failed to cancel invitation'
			});
		});

		// Fetch updated group data
		const { data: updatedGroup } = await readGroupGroupsGroupIdGet({
			path: {
				group_id: params.groupId
			}
		});

		return {
			group: updatedGroup,
			success: true
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
