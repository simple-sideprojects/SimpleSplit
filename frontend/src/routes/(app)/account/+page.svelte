<script lang="ts">
	import { env } from '$env/dynamic/public';
	import IconLock from '~icons/tabler/lock';
	import IconTrash from '~icons/tabler/trash';

	let username = 'Max Mustermann';
	let email = 'max@mustermann.de';
	let currentPassword = '';
	let newPassword = '';
	let confirmPassword = '';
	let isSubmitting = false;
	let error = '';
	let deleteConfirmation = '';
	let showDeleteConfirm = false;

	async function handleProfileUpdate(event: Event) {
		event.preventDefault();

		if (!username.trim() || !email.trim()) {
			error = 'Please fill in all fields';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			const response = await fetch(`${env.PUBLIC_BACKEND_URL}/api/account`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ username, email })
			});

			if (!response.ok) throw new Error('Failed to update profile');
		} catch (err) {
			console.error(err);
			error = 'Failed to update profile. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}

	async function handlePasswordUpdate(event: Event) {
		event.preventDefault();

		if (!currentPassword || !newPassword || !confirmPassword) {
			error = 'Please fill in all password fields';
			return;
		}

		if (newPassword !== confirmPassword) {
			error = 'New passwords do not match';
			return;
		}

		if (newPassword.length < 8) {
			error = 'New password must be at least 8 characters long';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			const response = await fetch(`${env.PUBLIC_BACKEND_URL}/api/account/password`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					currentPassword,
					newPassword
				})
			});

			if (!response.ok) throw new Error('Failed to update password');

			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
		} catch (err) {
			console.error(err);
			error = 'Failed to update password. Please verify your current password and try again.';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleAccountDelete(event: Event) {
		event.preventDefault();

		if (deleteConfirmation !== username) {
			error = 'Please type your username correctly to confirm deletion';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			const response = await fetch(`${env.PUBLIC_BACKEND_URL}/api/account`, {
				method: 'DELETE'
			});

			if (!response.ok) throw new Error('Failed to delete account');
		} catch (err) {
			console.error(err);
			error = 'Failed to delete account. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="space-y-4">
	<h1 class="text-2xl font-bold">Account Settings</h1>

	<!-- Profile Information -->
	<div class="rounded-lg border border-gray-100 bg-white shadow-sm">
		<div class="border-b border-gray-200 px-4 py-3">
			<h2 class="text-base font-medium text-gray-900">Profile Information</h2>
			<p class="mt-0.5 text-sm text-gray-500">Update your account details and email preferences.</p>
		</div>

		<form class="p-4" onsubmit={handleProfileUpdate}>
			<div class="grid grid-cols-2 gap-8">
				<div>
					<div class="mb-2 flex flex-col">
						<label for="username" class="text-sm font-medium text-gray-900">Username</label>
						<span class="mt-0.5 text-xs text-gray-500"
							>This is your display name visible to other users</span
						>
					</div>
					<input
						type="text"
						name="username"
						id="username"
						bind:value={username}
						required
						class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
					/>
				</div>

				<div>
					<div class="mb-2 flex flex-col">
						<label for="email" class="text-sm font-medium text-gray-900">Email Address</label>
						<span class="mt-0.5 text-xs text-gray-500"
							>Your email address for notifications and login</span
						>
					</div>
					<input
						type="email"
						name="email"
						id="email"
						bind:value={email}
						required
						class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
					/>
				</div>
			</div>

			{#if error}
				<div class="mt-4 rounded-md bg-red-50 p-3">
					<p class="text-sm text-red-700">{error}</p>
				</div>
			{/if}

			<div class="mt-4 flex justify-end">
				<button
					type="submit"
					disabled={isSubmitting}
					class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
				>
					{isSubmitting ? 'Saving...' : 'Save Changes'}
				</button>
			</div>
		</form>
	</div>

	<!-- Security -->
	<div class="rounded-lg border border-gray-100 bg-white shadow-sm">
		<div class="border-b border-gray-200 px-4 py-3">
			<h2 class="text-base font-medium text-gray-900">Security</h2>
			<p class="mt-0.5 text-sm text-gray-500">
				Manage your password and account security settings.
			</p>
		</div>

		<form class="p-4" onsubmit={handlePasswordUpdate}>
			<div class="grid gap-4 lg:grid-cols-2">
				<div>
					<div class="mb-2 flex flex-col">
						<label for="newPassword" class="text-sm font-medium text-gray-900">New Password</label>
						<span class="mt-0.5 text-xs text-gray-500">At least 8 characters required</span>
					</div>
					<input
						type="password"
						name="newPassword"
						id="newPassword"
						bind:value={newPassword}
						required
						minlength="8"
						class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
						placeholder="Enter new password"
					/>
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
						bind:value={confirmPassword}
						required
						class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
						placeholder="Confirm new password"
					/>
				</div>

				<div>
					<div class="mb-2 flex flex-col">
						<label for="currentPassword" class="text-sm font-medium text-gray-900"
							>Current Password</label
						>
						<span class="mt-0.5 text-xs text-gray-500">Enter your current password to verify</span>
					</div>
					<input
						type="password"
						name="currentPassword"
						id="currentPassword"
						bind:value={currentPassword}
						required
						class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
						placeholder="Enter current password"
					/>
				</div>
			</div>

			{#if error}
				<div class="mt-4 rounded-md bg-red-50 p-3">
					<p class="text-sm text-red-700">{error}</p>
				</div>
			{/if}

			<div class="mt-4 flex justify-end">
				<button
					type="submit"
					disabled={isSubmitting}
					class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
				>
					<IconLock class="size-4" />
					{isSubmitting ? 'Updating Password...' : 'Update Password'}
				</button>
			</div>
		</form>
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
						class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
					>
						<IconTrash class="size-4" />
						Delete Account
					</button>
				</div>
			{:else}
				<form class="space-y-4" onsubmit={handleAccountDelete}>
					<div>
						<div class="mb-2 flex flex-col">
							<label for="confirm" class="text-sm font-medium text-gray-900">Confirm Deletion</label
							>
							<span class="mt-0.5 text-xs text-gray-500"
								>Please type your username "{username}" to confirm</span
							>
						</div>
						<input
							type="text"
							name="confirm"
							id="confirm"
							bind:value={deleteConfirmation}
							required
							class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 sm:text-sm"
							placeholder="Enter your username to confirm"
						/>
					</div>

					<div class="flex justify-end gap-3">
						<button
							type="button"
							onclick={() => {
								showDeleteConfirm = false;
								deleteConfirmation = '';
							}}
							class="rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting || deleteConfirmation !== username}
							class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
						>
							<IconTrash class="size-4" />
							{isSubmitting ? 'Deleting...' : 'Confirm Delete'}
						</button>
					</div>
				</form>
			{/if}
		</div>
	</div>
</div>
