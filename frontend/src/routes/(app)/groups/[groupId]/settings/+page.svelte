<script lang="ts">
	import { goto } from '$app/navigation';
	import { env } from '$env/dynamic/public';
	import { onMount } from 'svelte';
	import IconTrash from '~icons/tabler/trash';
	import IconUserPlus from '~icons/tabler/user-plus';
	import IconX from '~icons/tabler/x';

	let { data } = $props();

	let newMemberUsername = $state('');
	let error = $state('');
	let isAddingMember = $state(false);
	let memberToRemove = $state<string | null>(null);
	let isRemovingMember = $state(false);
	let showDeleteConfirm = $state(false);
	let deleteConfirmation = $state('');
	let isDeletingGroup = $state(false);

	onMount(() => {
		if (!data.group) {
			goto('/');
		}
	});

	async function handleAddMember(event: Event) {
		event.preventDefault();

		if (!newMemberUsername.trim()) {
			error = 'Please enter a username';
			return;
		}

		isAddingMember = true;
		error = '';

		try {
			const response = await fetch(
				`${env.PUBLIC_BACKEND_URL}/api/groups/${data.group.id}/members`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ username: newMemberUsername })
				}
			);

			if (!response.ok) {
				const statusText = response.statusText;
				throw new Error(statusText || 'Failed to add member');
			}

			const updatedGroup = await response.json();
			data.group = updatedGroup;
			newMemberUsername = '';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to add member';
		} finally {
			isAddingMember = false;
		}
	}

	async function handleRemoveMember(username: string | null) {
		if (!username) {
			return;
		}

		isRemovingMember = true;
		error = '';

		try {
			const response = await fetch(
				`${env.PUBLIC_BACKEND_URL}/api/groups/${data.group.id}/members/${username}`,
				{
					method: 'DELETE'
				}
			);

			if (!response.ok) {
				throw new Error('Failed to remove member');
			}

			const updatedGroup = await response.json();
			data.group = updatedGroup;
			memberToRemove = null;
		} catch (err) {
			console.error(err);
			error = 'Failed to remove member';
		} finally {
			isRemovingMember = false;
		}
	}
</script>

{#if data.group}
	<div class="space-y-6">
		<h1 class="text-xl font-bold">Group Settings</h1>

		<!-- Member Management -->
		<div class="rounded-lg border border-gray-100 bg-white shadow-sm">
			<div class="border-b border-gray-200 px-4 py-3">
				<h2 class="text-base font-medium text-gray-900">Group Members</h2>
				<p class="mt-0.5 text-sm text-gray-500">Manage who has access to this group.</p>
			</div>

			<div class="p-4">
				<!-- Add Member Form -->
				<form class="mb-6" onsubmit={handleAddMember}>
					<div class="flex gap-3">
						<div class="flex-1">
							<input
								type="text"
								placeholder="Enter username to add"
								bind:value={newMemberUsername}
								class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
							/>
						</div>
						<button
							type="submit"
							disabled={isAddingMember}
							class="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
						>
							<IconUserPlus class="size-4" />
							{isAddingMember ? 'Adding...' : 'Add Member'}
						</button>
					</div>
				</form>

				{#if error}
					<div class="mb-4 rounded-md bg-red-50 p-3">
						<p class="text-sm text-red-700">{error}</p>
					</div>
				{/if}

				<!-- Members List -->
				<div class="space-y-2">
					{#each data.group.users ?? [] as member (member.id)}
						<div class="flex items-center justify-between rounded-lg border border-gray-100 p-3">
							<span class="font-medium">{member.username}</span>
							<button
								type="button"
								class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
								onclick={() => (memberToRemove = member.id)}
							>
								<IconTrash class="size-4" />
							</button>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Delete Group -->
		<div class="rounded-lg border border-gray-100 bg-white shadow-sm">
			<div class="border-b border-gray-200 px-4 py-3">
				<h2 class="text-base font-medium text-gray-900">Delete Group</h2>
				<p class="mt-0.5 text-sm text-gray-500">
					Once you delete a group, there is no going back. Please be certain.
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
							Delete Group
						</button>
					</div>
				{:else}
					<form action="?/deleteGroup" method="POST">
						<div class="mb-2 flex flex-col">
							<label for="confirm" class="text-sm font-medium text-gray-900">Confirm Deletion</label
							>
							<span class="mt-0.5 text-xs text-gray-500"
								>Please type "{data.group.name}" to confirm</span
							>
						</div>
						<input
							type="text"
							name="confirm"
							id="confirm"
							bind:value={deleteConfirmation}
							required
							class="cursor-po w-full rounded-lg border border-gray-300 px-3 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 sm:text-sm"
							placeholder="Enter group name to confirm"
						/>

						<div class="mt-4 flex justify-end gap-3">
							<button
								type="button"
								onclick={() => {
									showDeleteConfirm = false;
									deleteConfirmation = '';
								}}
								class="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={isDeletingGroup || deleteConfirmation !== data.group.name}
								class="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
							>
								<IconTrash class="size-4" />
								{isDeletingGroup ? 'Deleting...' : 'Confirm Delete'}
							</button>
						</div>
					</form>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Remove Member Confirmation Dialog -->
{#if memberToRemove}
	<div class="fixed inset-0 z-10 overflow-y-auto">
		<div
			class="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0"
		>
			<div class="fixed inset-0 transition-opacity" aria-hidden="true">
				<div class="absolute inset-0 bg-gray-500 opacity-75"></div>
			</div>

			<div
				class="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle"
			>
				<div class="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
					<button
						type="button"
						class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
						onclick={() => (memberToRemove = null)}
					>
						<span class="sr-only">Close</span>
						<IconX class="size-6" />
					</button>
				</div>

				<div class="sm:flex sm:items-start">
					<div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
						<h3 class="text-lg leading-6 font-medium text-gray-900">Remove Member</h3>
						<div class="mt-2">
							<p class="text-sm text-gray-500">
								Are you sure you want to remove {memberToRemove} from this group? This action cannot
								be undone.
							</p>
						</div>
					</div>
				</div>

				<div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
					<button
						type="button"
						class="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
						onclick={() => handleRemoveMember(memberToRemove)}
						disabled={isRemovingMember}
					>
						{isRemovingMember ? 'Removing...' : 'Remove'}
					</button>
					<button
						type="button"
						class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
						onclick={() => (memberToRemove = null)}
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
