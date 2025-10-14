import {
	deleteUserAccountDelete,
	readUsersMeAccountGet,
	updatePasswordAccountPasswordPut,
	updateUserInfoAccountPut
} from '$lib/client';
import { zUserInfoUpdate } from '$lib/client/zod.gen';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { deleteAccountSchema, passwordFormSchema } from '$lib/shared/form/validators';

export const actions: Actions = {
	updateUsername: async ({ request }) => {
		const form = await superValidate(request, zod(zUserInfoUpdate));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { error } = await updateUserInfoAccountPut({
			body: {
				username: form.data.username
			}
		});

		if (error) {
			console.error('Error updating username:', error);
			return setError(form, '', 'Failed to update username. Please try again.');
		}

		const { data: userData } = await readUsersMeAccountGet();

		return {
			form,
			userData,
			success: true
		};
	},

	updatePassword: async ({ request }) => {
		const form = await superValidate(request, zod(passwordFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { error } = await updatePasswordAccountPasswordPut({
			body: {
				old_password: form.data.old_password,
				new_password: form.data.new_password
			}
		});

		if (error) {
			console.error('Error updating password:', error);
			return setError(
				form,
				'',
				'Failed to update password. Please verify your current password and try again.'
			);
		}

		return {
			form,
			success: true
		};
	},

	signOut: async ({ cookies }) => {
		cookies.delete('auth_token', { path: '/' });

		throw redirect(303, '/auth/login');
	},

	deleteAccount: async ({ request, cookies }) => {
		const form = await superValidate(request, zod(deleteAccountSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { data: userData, error: userError } = await readUsersMeAccountGet();

		if (userError || !userData) {
			console.error('Error fetching user data for verification:', userError);
			return setError(form, '', 'Failed to verify user data. Please try again.');
		}

		if (form.data.deleteConfirmation !== userData.username) {
			return setError(form, 'deleteConfirmation', 'Username confirmation does not match');
		}

		const { error } = await deleteUserAccountDelete();

		if (error) {
			console.error('Error deleting account:', error);
			return setError(form, '', 'Failed to delete account. Please try again.');
		}

		cookies.delete('auth_token', { path: '/' });

		throw redirect(303, '/auth/login');
	}
};
