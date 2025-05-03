import {
	deleteUserAccountDelete,
	readUsersMeAccountGet,
	updatePasswordAccountPasswordPut,
	updateUserInfoAccountPut
} from '$lib/client';
import { zUserInfoUpdate } from '$lib/client/zod.gen';
import { fail, redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

const passwordFormSchema = z
	.object({
		old_password: z.string().min(1, 'Current password is required'),
		new_password: z.string().min(8, 'New password must be at least 8 characters long'),
		confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters long')
	})
	.refine((data) => data.new_password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword']
	});

const deleteAccountSchema = z.object({
	deleteConfirmation: z.string().min(1, 'Confirmation is required')
});

export async function load() {
	const { data: userData, error } = await readUsersMeAccountGet();

	if (error || !userData) {
		console.error('Error fetching user data:', error);

		return {
			userData: null,
			usernameForm: await superValidate(zod(zUserInfoUpdate)),
			passwordForm: await superValidate(zod(passwordFormSchema)),
			deleteAccountForm: await superValidate(zod(deleteAccountSchema))
		};
	}

	const usernameForm = await superValidate(
		{
			username: userData.username
		},
		zod(zUserInfoUpdate)
	);

	const passwordForm = await superValidate(zod(passwordFormSchema));
	const deleteAccountForm = await superValidate(zod(deleteAccountSchema));

	return {
		userData,
		usernameForm,
		passwordForm,
		deleteAccountForm
	};
}

export const actions = {
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

		return redirect(303, '/auth/login');
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

		return redirect(303, '/auth/login');
	}
};
