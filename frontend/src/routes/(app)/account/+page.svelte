<script lang="ts">
	import { isCompiledStatic, onPageLoad } from '$lib/shared/app/controller.js';
	import { superForm } from '$lib/shared/form/super-form.js';
	import { authStore, clientSideLogout, type User } from '$lib/shared/stores/auth.store.js';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import IconDeviceFloppy from '~icons/tabler/device-floppy';
	import IconLoader from '~icons/tabler/loader';
	import IconLock from '~icons/tabler/lock';
	import IconLogout from '~icons/tabler/logout';
	import IconTrash from '~icons/tabler/trash';
	import type { PageData } from './$types.js';
	import type { ActionResult } from '@sveltejs/kit';

	//Handle provided data
	let { data } = $props<{ data: PageData }>();
	let userData: User|null = $derived($authStore.user);

	//Update auth store if it is available through server load()
	$effect(() => {
		if(data.userData !== undefined){
			$authStore.user = data.userData;
		}
	});

	//Handle Username Form
	const {
		form: usernameForm,
		enhance: enhanceUsername,
		errors: usernameErrors,
		submitting: usernameSubmitting
	} = superForm(data.usernameForm, {
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Username updated successfully');
			}
		}
	});

	//Update Username Form
	$effect(() => {
		if(userData){
			usernameForm.update((formData) => {
				formData.username = userData.username;
				return formData;
			})
		}
	})

	//Handle Password Form
	const {
		form: passwordForm,
		enhance: enhancePassword,
		errors: passwordErrors,
		submitting: passwordSubmitting
	} = superForm(data.passwordForm, {
		resetForm: true,
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Password updated successfully');
			}
		}
	});

	//Handle Delete Account Form
	let showDeleteConfirm = $state(false);
	const {
		form: deleteAccountForm,
		enhance: enhanceDeleteAccount,
		errors: deleteAccountErrors,
		submitting: deleteAccountSubmitting
	} = superForm(data.deleteAccountForm, {
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Account deleted successfully');
			}
		}
	});

	//Sign Out Form
	const {
		enhance: enhanceSignOut
	} = superForm({}, {
		onResult: async ({ result }) => {
			if (result.type === 'success') {
				toast.success('Signed out successfully');
				await clientSideLogout();
			}
		}
	});
	
	//Mobile App functionality
	onMount(async () => {
		if(!isCompiledStatic()){
			return;
		}
		const serverResponse : ActionResult<{
			userData: User,
		}> = await onPageLoad(true, {
			userData: userData
		});
		if(serverResponse.type !== 'success' || !serverResponse.data){
			return;
		}
		$authStore.user = serverResponse.data.userData;
	});
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Account Settings</h1>
		<!-- Mobile Sign Out Button -->
		<form action="?/signOut" method="POST" class="sm:hidden" use:enhanceSignOut>
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
			<!-- Username Form -->
			<form action="?/updateUsername" method="POST" class="grid gap-4" use:enhanceUsername>
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
					{#if $usernameErrors._errors}
						<div class="mt-2 rounded-md bg-red-50 p-2">
							<p class="text-xs text-red-700">{$usernameErrors._errors}</p>
						</div>
					{/if}
				</div>
			</form>

			<!-- Email Form -->
			<div class="flex flex-col">
				<div class="mb-2 flex flex-col">
					<label for="email" class="text-sm font-medium text-gray-900">Email Address</label>
					<span class="mt-0.5 text-xs text-gray-500"
						>Your email address for notifications and login</span
					>
				</div>
				<input
					type="email"
					id="email"
					value={userData?.email}
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
			<p class="mt-0.5 text-sm text-gray-500">
				Manage your password and account security settings.
			</p>
		</div>

		<form action="?/updatePassword" method="POST" class="p-4" use:enhancePassword>
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
						placeholder="Enter new password"
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
						<span class="mt-0.5 text-xs text-gray-500">Re-enter your new password</span>
					</div>
					<input
						type="password"
						name="confirmPassword"
						id="confirmPassword"
						bind:value={$passwordForm.confirmPassword}
						required
						class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
						placeholder="Confirm new password"
					/>
					{#if $passwordErrors.confirmPassword}
						<p class="mt-1 text-xs text-red-600">{$passwordErrors.confirmPassword}</p>
					{/if}
				</div>

				<div>
					<div class="mb-2 flex flex-col">
						<label for="old_password" class="text-sm font-medium text-gray-900"
							>Current Password</label
						>
						<span class="mt-0.5 text-xs text-gray-500">Enter your current password to verify</span>
					</div>
					<input
						type="password"
						name="old_password"
						id="old_password"
						bind:value={$passwordForm.old_password}
						required
						class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
						placeholder="Enter current password"
					/>
					{#if $passwordErrors.old_password}
						<p class="mt-1 text-xs text-red-600">{$passwordErrors.old_password}</p>
					{/if}
				</div>
			</div>

			{#if $passwordErrors._errors}
				<div class="mt-4 rounded-md bg-red-50 p-3">
					<p class="text-sm text-red-700">{$passwordErrors._errors}</p>
				</div>
			{/if}

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
			<p class="mt-0.5 text-sm text-gray-500">Sign out from your account on this device.</p>
		</div>

		<div class="p-4">
			<div class="flex flex-col sm:flex-row sm:justify-between">
				<p class="mb-4 text-sm text-gray-700 sm:mb-0">
					This will sign you out from your current session on this device.
				</p>
				<form action="?/signOut" method="POST" use:enhanceSignOut>
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
				<form action="?/deleteAccount" method="POST" class="space-y-4" use:enhanceDeleteAccount>
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
							placeholder="Enter your username to confirm"
						/>
						{#if $deleteAccountErrors.deleteConfirmation}
							<p class="mt-1 text-xs text-red-600">{$deleteAccountErrors.deleteConfirmation}</p>
						{/if}
					</div>

					{#if $deleteAccountErrors._errors}
						<div class="mt-4 rounded-md bg-red-50 p-3">
							<p class="text-sm text-red-700">{$deleteAccountErrors._errors}</p>
						</div>
					{/if}

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
