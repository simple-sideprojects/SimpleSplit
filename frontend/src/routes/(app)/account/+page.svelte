<script lang="ts">
	import {
		deleteUserAccountDeleteMutation,
		readUsersMeAccountGetQueryKey,
		updatePasswordAccountPasswordPutMutation,
		updateUserInfoAccountPutMutation
	} from '$lib/client/@tanstack/svelte-query.gen';
	import { meQueryOptions } from '$lib/query/options';
	import { superForm } from '$lib/shared/form/super-form';
	import { clientSideLogout } from '$lib/shared/stores/auth.store.js';
	import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import IconDeviceFloppy from '~icons/tabler/device-floppy';
	import IconLoader from '~icons/tabler/loader';
	import IconLock from '~icons/tabler/lock';
	import IconLogout from '~icons/tabler/logout';
	import IconTrash from '~icons/tabler/trash';
	import type { PageData } from './$types.js';

	let { data } = $props<{ data: PageData }>();

	const queryClient = useQueryClient();
	const meQuery = createQuery(meQueryOptions());
	let userData = $derived($meQuery.data ?? null);

	const updateUsernameMutation = createMutation(updateUserInfoAccountPutMutation());
	const updatePasswordMutation = createMutation(updatePasswordAccountPasswordPutMutation());
	const deleteAccountMutation = createMutation(deleteUserAccountDeleteMutation());

	// Username form
	const {
		form: usernameForm,
		enhance: enhanceUsername,
		errors: usernameErrors,
		submitting: usernameSubmitting
	} = superForm(data.usernameForm, {
		onUpdate: async ({ form, cancel }) => {
			if (!form.valid) return;
			try {
				await $updateUsernameMutation.mutateAsync({
					body: { username: form.data.username as string }
				});
				await queryClient.invalidateQueries({ queryKey: readUsersMeAccountGetQueryKey() });
				toast.success('Username updated successfully');
			} catch {
				toast.error('Failed to update username');
				cancel();
			}
		}
	});

	$effect(() => {
		if (userData && !$usernameForm.username) {
			usernameForm.update((f) => ({ ...f, username: userData.username }));
		}
	});

	// Password form
	const {
		form: passwordForm,
		enhance: enhancePassword,
		errors: passwordErrors,
		submitting: passwordSubmitting,
		reset: resetPassword
	} = superForm(data.passwordForm, {
		resetForm: true,
		onUpdate: async ({ form, cancel }) => {
			if (!form.valid) return;
			try {
				await $updatePasswordMutation.mutateAsync({
					body: {
						old_password: form.data.old_password as string,
						new_password: form.data.new_password as string
					}
				});
				toast.success('Password updated successfully');
				resetPassword();
			} catch {
				toast.error('Failed to update password');
				cancel();
			}
		}
	});

	// Delete account
	let showDeleteConfirm = $state(false);
	const {
		form: deleteAccountForm,
		enhance: enhanceDeleteAccount,
		errors: deleteAccountErrors,
		submitting: deleteAccountSubmitting
	} = superForm(data.deleteAccountForm, {
		onUpdate: async ({ form, cancel }) => {
			if (!form.valid) return;
			if (form.data.deleteConfirmation !== userData?.username) {
				deleteAccountErrors.update((e) => ({
					...e,
					deleteConfirmation: ['Username confirmation does not match']
				}));
				return cancel();
			}
			try {
				await $deleteAccountMutation.mutateAsync({});
				toast.success('Account deleted successfully');
				await fetch('/api/auth/logout/', { method: 'POST' });
				await clientSideLogout();
			} catch {
				toast.error('Failed to delete account');
				cancel();
			}
		}
	});

	async function signOut(event: SubmitEvent) {
		event.preventDefault();
		await fetch('/api/auth/logout/', { method: 'POST' });
		toast.success('Signed out successfully');
		await clientSideLogout();
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Account Settings</h1>
		<form class="sm:hidden" onsubmit={signOut}>
			<button
				type="submit"
				class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
			>
				<IconLogout class="size-4" />
				Sign Out
			</button>
		</form>
	</div>

	<!-- Profile Information -->
	<div class="rounded-lg border border-gray-100 bg-white shadow-sm">
		<div class="border-b border-gray-200 px-4 py-3">
			<h2 class="text-base font-medium text-gray-900">Profile Information</h2>
			<p class="mt-0.5 text-sm text-gray-500">Update your account details and email preferences.</p>
		</div>

		<div class="grid gap-8 p-4">
			<form method="POST" class="grid gap-4" use:enhanceUsername>
				<div>
					<div class="mb-2 flex flex-col">
						<label for="username" class="text-sm font-medium text-gray-900">Username</label>
						<span class="mt-0.5 text-xs text-gray-500"
							>This is your display name visible to other users</span
						>
					</div>
					<div class="flex gap-3">
						<input
							type="text"
							name="username"
							id="username"
							bind:value={$usernameForm.username}
							required
							class="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
						/>
						<button
							type="submit"
							disabled={$usernameSubmitting}
							class="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
						>
							{#if $usernameSubmitting}
								<IconLoader class="size-4 animate-spin" />
								Saving...
							{:else}
								<IconDeviceFloppy class="size-4" />
								Save
							{/if}
						</button>
					</div>
					{#if $usernameErrors.username}
						<p class="mt-1 text-xs text-red-600">{$usernameErrors.username}</p>
					{/if}
				</div>
			</form>

			<div class="flex flex-col">
				<div class="mb-2 flex flex-col">
					<label for="email" class="text-sm font-medium text-gray-900">Email Address</label>
					<span class="mt-0.5 text-xs text-gray-500">Your email address for notifications and login</span>
				</div>
				<input
					type="email"
					id="email"
					value={userData?.email ?? ''}
					readonly
					class="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-gray-600 sm:text-sm"
				/>
			</div>
		</div>
	</div>

	<!-- Security -->
	<div class="rounded-lg border border-gray-100 bg-white shadow-sm">
		<div class="border-b border-gray-200 px-4 py-3">
			<h2 class="text-base font-medium text-gray-900">Security</h2>
			<p class="mt-0.5 text-sm text-gray-500">Manage your password and account security settings.</p>
		</div>

		<form method="POST" class="p-4" use:enhancePassword>
			<div class="grid gap-4 lg:grid-cols-2">
				<div>
					<div class="mb-2 flex flex-col">
						<label for="new_password" class="text-sm font-medium text-gray-900">New Password</label>
						<span class="mt-0.5 text-xs text-gray-500">At least 8 characters required</span>
					</div>
					<input
						type="password"
						name="new_password"
						id="new_password"
						bind:value={$passwordForm.new_password}
						required
						minlength="8"
						class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
					/>
					{#if $passwordErrors.new_password}
						<p class="mt-1 text-xs text-red-600">{$passwordErrors.new_password}</p>
					{/if}
				</div>

				<div>
					<div class="mb-2 flex flex-col">
						<label for="confirmPassword" class="text-sm font-medium text-gray-900"
							>Confirm New Password</label
						>
					</div>
					<input
						type="password"
						name="confirmPassword"
						id="confirmPassword"
						bind:value={$passwordForm.confirmPassword}
						required
						class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
					/>
					{#if $passwordErrors.confirmPassword}
						<p class="mt-1 text-xs text-red-600">{$passwordErrors.confirmPassword}</p>
					{/if}
				</div>

				<div>
					<div class="mb-2 flex flex-col">
						<label for="old_password" class="text-sm font-medium text-gray-900">Current Password</label>
					</div>
					<input
						type="password"
						name="old_password"
						id="old_password"
						bind:value={$passwordForm.old_password}
						required
						class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
					/>
					{#if $passwordErrors.old_password}
						<p class="mt-1 text-xs text-red-600">{$passwordErrors.old_password}</p>
					{/if}
				</div>
			</div>

			<div class="mt-4 flex justify-end">
				<button
					type="submit"
					disabled={$passwordSubmitting}
					class="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
				>
					<IconLock class="size-4" />
					{$passwordSubmitting ? 'Updating Password...' : 'Update Password'}
				</button>
			</div>
		</form>
	</div>

	<!-- Sign Out -->
	<div class="rounded-lg border border-gray-100 bg-white shadow-sm">
		<div class="border-b border-gray-200 px-4 py-3">
			<h2 class="text-base font-medium text-gray-900">Sign Out</h2>
		</div>

		<div class="p-4">
			<div class="flex flex-col sm:flex-row sm:justify-between">
				<p class="mb-4 text-sm text-gray-700 sm:mb-0">
					This will sign you out from your current session on this device.
				</p>
				<form onsubmit={signOut}>
					<button
						type="submit"
						class="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gray-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
					>
						<IconLogout class="size-4" />
						Sign Out
					</button>
				</form>
			</div>
		</div>
	</div>

	<!-- Delete Account -->
	<div class="rounded-lg border border-gray-100 bg-white shadow-sm">
		<div class="border-b border-gray-200 px-4 py-3">
			<h2 class="text-base font-medium text-gray-900">Delete Account</h2>
			<p class="mt-0.5 text-sm text-gray-500">
				Once you delete your account, there is no going back. Please be certain.
			</p>
		</div>

		<div class="p-4">
			{#if !showDeleteConfirm}
				<div class="flex justify-end">
					<button
						type="button"
						onclick={() => (showDeleteConfirm = true)}
						class="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
					>
						<IconTrash class="size-4" />
						Delete Account
					</button>
				</div>
			{:else}
				<form method="POST" class="space-y-4" use:enhanceDeleteAccount>
					<div>
						<div class="mb-2 flex flex-col">
							<label for="deleteConfirmation" class="text-sm font-medium text-gray-900"
								>Confirm Deletion</label
							>
							<span class="mt-0.5 text-xs text-gray-500"
								>Please type your username "{userData?.username}" to confirm</span
							>
						</div>
						<input
							type="text"
							name="deleteConfirmation"
							id="deleteConfirmation"
							bind:value={$deleteAccountForm.deleteConfirmation}
							required
							class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 sm:text-sm"
						/>
						{#if $deleteAccountErrors.deleteConfirmation}
							<p class="mt-1 text-xs text-red-600">{$deleteAccountErrors.deleteConfirmation}</p>
						{/if}
					</div>

					<div class="flex justify-end gap-3">
						<button
							type="button"
							onclick={() => {
								showDeleteConfirm = false;
								$deleteAccountForm.deleteConfirmation = '';
							}}
							class="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={$deleteAccountSubmitting}
							class="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
						>
							<IconTrash class="size-4" />
							{$deleteAccountSubmitting ? 'Deleting...' : 'Confirm Delete'}
						</button>
					</div>
				</form>
			{/if}
		</div>
	</div>
</div>
