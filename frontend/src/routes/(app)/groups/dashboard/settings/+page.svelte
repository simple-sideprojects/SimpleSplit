<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import {
		deleteGroupGroupsGroupIdDeleteMutation,
		deleteUserFromGroupGroupsGroupIdUsersUserIdDeleteMutation,
		generateInviteLinkInvitesGroupIdGeneratePostMutation,
		inviteByEmailInvitesGroupIdEmailPostMutation,
		readGroupGroupsGroupIdGetQueryKey,
		readGroupsGroupsGetQueryKey,
		rejectInviteInvitesRejectTokenDeleteMutation
	} from '$lib/client/@tanstack/svelte-query.gen';
	import { groupQueryOptions } from '$lib/query/options';
	import { superForm } from '$lib/shared/form/super-form';
	import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import IconCopy from '~icons/tabler/copy';
	import IconLink from '~icons/tabler/link';
	import IconTrash from '~icons/tabler/trash';
	import IconUserPlus from '~icons/tabler/user-plus';
	import IconX from '~icons/tabler/x';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
	const groupId = $derived((data.groupId ?? '') as string);

	const queryClient = useQueryClient();
	const groupQuery = createQuery(groupQueryOptions(groupId));
	let group = $derived($groupQuery.data);

	const inviteByEmail = createMutation(inviteByEmailInvitesGroupIdEmailPostMutation());
	const generateLink = createMutation(generateInviteLinkInvitesGroupIdGeneratePostMutation());
	const deleteGroup = createMutation(deleteGroupGroupsGroupIdDeleteMutation());
	const rejectInvite = createMutation(rejectInviteInvitesRejectTokenDeleteMutation());
	const removeMember = createMutation(deleteUserFromGroupGroupsGroupIdUsersUserIdDeleteMutation());

	let memberToRemove = $state<string | null>(null);
	let showDeleteConfirm = $state(false);
	let deleteConfirmation = $state('');
	let isDeletingGroup = $state(false);
	let isRemovingMember = $state(false);
	let isCancelingInvite = $state(false);

	async function invalidateGroup() {
		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: readGroupGroupsGroupIdGetQueryKey({ path: { group_id: groupId } })
			}),
			queryClient.invalidateQueries({ queryKey: readGroupsGroupsGetQueryKey() })
		]);
	}

	const {
		form: inviteMemberForm,
		enhance: enhanceInvite,
		submitting: inviteSubmitting,
		errors: inviteMemberErrors,
		reset: resetInviteForm
	} = superForm(data.inviteMemberForm, {
		resetForm: true,
		onUpdate: async ({ form, cancel }) => {
			if (!form.valid) return;
			try {
				await $inviteByEmail.mutateAsync({
					path: { group_id: groupId },
					body: { email: form.data.email as string }
				});
				await invalidateGroup();
				toast.success(`Invitation sent to ${form.data.email}`);
				resetInviteForm();
			} catch (e) {
				toast.error(e instanceof Error ? e.message : 'Failed to send invitation');
				cancel();
			}
		}
	});

	async function handleGenerateLink() {
		try {
			const res = await $generateLink.mutateAsync({ path: { group_id: groupId } });
			if (browser && res?.token) {
				const link = `${document.location.origin}/groups/invite?token=${res.token}`;
				await navigator.clipboard.writeText(link);
				toast.success('Invite link copied to clipboard');
			}
			await invalidateGroup();
		} catch {
			toast.error('Failed to generate invite link');
		}
	}

	async function handleCancelInvite(token: string) {
		isCancelingInvite = true;
		try {
			await $rejectInvite.mutateAsync({ path: { token } });
			await invalidateGroup();
			toast.success('Invitation canceled');
		} catch {
			toast.error('Failed to cancel invitation');
		} finally {
			isCancelingInvite = false;
		}
	}

	async function handleRemoveMember() {
		if (!memberToRemove) return;
		isRemovingMember = true;
		try {
			await $removeMember.mutateAsync({
				path: { group_id: groupId, user_id: memberToRemove }
			});
			await invalidateGroup();
			toast.success('Member removed successfully');
		} catch {
			toast.error('Failed to remove member');
		} finally {
			isRemovingMember = false;
			memberToRemove = null;
		}
	}

	async function handleDeleteGroup(event: SubmitEvent) {
		event.preventDefault();
		if (!group || deleteConfirmation !== group.name) return;
		isDeletingGroup = true;
		try {
			await $deleteGroup.mutateAsync({ path: { group_id: groupId } });
			await queryClient.invalidateQueries({ queryKey: readGroupsGroupsGetQueryKey() });
			toast.success('Group deleted successfully');
			await goto('/');
		} catch {
			toast.error('Failed to delete group');
			isDeletingGroup = false;
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text).then(
			() => toast.success('Link copied to clipboard'),
			() => toast.error('Failed to copy link')
		);
	}
</script>

{#if group}
	<div class="space-y-6">
		<h1 class="text-xl font-bold">Group Settings</h1>

		<!-- Member Management -->
		<div class="rounded-lg border border-gray-100 bg-white shadow-sm">
			<div class="border-b border-gray-200 px-4 py-3">
				<h2 class="text-base font-medium text-gray-900">Group Members</h2>
				<p class="mt-0.5 text-sm text-gray-500">Manage who has access to this group.</p>
			</div>

			<div class="p-4">
				<div class="flex gap-3">
					<form method="POST" class="flex flex-1 gap-3" use:enhanceInvite>
						<div class="flex-1">
							<input
								type="email"
								name="email"
								bind:value={$inviteMemberForm.email}
								placeholder="Enter email to invite"
								class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
							/>
						</div>
						<button
							type="submit"
							disabled={$inviteSubmitting}
							class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
						>
							<IconUserPlus class="size-4" />
							{$inviteSubmitting ? 'Inviting...' : 'Invite Member'}
						</button>
					</form>

					<button
						type="button"
						onclick={handleGenerateLink}
						class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-gray-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
					>
						<IconLink class="size-4" />
						Create Link
					</button>
				</div>

				{#if $inviteMemberErrors.email}
					<div class="mt-2 rounded-md bg-red-50 p-3">
						<p class="text-sm text-red-700">{$inviteMemberErrors.email}</p>
					</div>
				{/if}

				<h3 class="mt-4 mb-2 text-sm font-medium text-gray-700">Active Members</h3>
				<div class="space-y-2">
					{#each group.users ?? [] as member (member.id)}
						<div class="flex items-center justify-between rounded-lg border border-gray-100 p-3">
							<span class="text-sm">
								{member.username}
								<span class="text-gray-500">({member.email})</span>
							</span>
							<button
								type="button"
								class="cursor-pointer rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
								onclick={() => (memberToRemove = member.id)}
							>
								<IconTrash class="size-4" />
							</button>
						</div>
					{/each}
				</div>

				{#if group.invites && group.invites.length > 0}
					<h3 class="mt-4 mb-2 text-sm font-medium text-gray-700">Pending Invitations</h3>
					<div class="space-y-2">
						{#each group.invites as invite (invite.id)}
							<div
								class="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
							>
								<div class="flex items-center text-sm text-gray-600">
									{#if invite.email}
										{invite.email}
									{:else if browser}
										<button
											class="mr-1.5 cursor-pointer text-gray-500 hover:text-gray-700"
											onclick={() =>
												copyToClipboard(
													`${document.location.origin}/groups/invite?token=${invite.token}`
												)}
										>
											<IconCopy class="size-4" />
										</button>
										<span class="truncate"
											>{document.location.origin}/groups/invite?token={invite.token}</span
										>
									{/if}
								</div>
								<button
									type="button"
									disabled={isCancelingInvite}
									onclick={() => handleCancelInvite(invite.token)}
									class="cursor-pointer rounded-lg p-1.5 text-gray-500 hover:bg-gray-200 disabled:opacity-50"
								>
									<IconX class="size-4" />
								</button>
							</div>
						{/each}
					</div>
				{/if}
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
					<form onsubmit={handleDeleteGroup}>
						<div class="mb-2 flex flex-col">
							<label for="confirm" class="text-sm font-medium text-gray-900">Confirm Deletion</label>
							<span class="mt-0.5 text-xs text-gray-500">Please type "{group.name}" to confirm</span>
						</div>
						<input
							type="text"
							name="confirm"
							id="confirm"
							bind:value={deleteConfirmation}
							required
							class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 sm:text-sm"
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
								disabled={isDeletingGroup || deleteConfirmation !== group.name}
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
						class="cursor-pointer rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
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
								Are you sure you want to remove this member from the group? This action cannot be
								undone.
							</p>
						</div>
					</div>
				</div>

				<div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
					<button
						type="button"
						disabled={isRemovingMember}
						onclick={handleRemoveMember}
						class="inline-flex w-full cursor-pointer justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
					>
						{isRemovingMember ? 'Removing...' : 'Remove'}
					</button>
					<button
						type="button"
						class="mt-3 inline-flex w-full cursor-pointer justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
						onclick={() => (memberToRemove = null)}
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
