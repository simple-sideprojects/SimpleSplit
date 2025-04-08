<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import IconCheck from '~icons/tabler/check';
	import IconEdit from '~icons/tabler/edit';
	import IconHistory from '~icons/tabler/history';
	import IconSettings from '~icons/tabler/settings';
	import IconUsers from '~icons/tabler/users';
	import IconX from '~icons/tabler/x';

	let { data, children } = $props();

	onMount(() => {
		if (!data.group) {
			goto(`/`);
		}
	});

	const { form } = superForm(data.updateGroupNameForm);

	let currentPath = $derived(`${page.url.pathname}`);
	let isEditing = $state(false);
</script>

{#if data.group}
	<div>
		<header class="mb-8">
			<h1 class="text-2xl font-bold">
				{#if isEditing}
					<form
						action="/groups/{data.group.id}/settings?/updateGroupName"
						method="POST"
						class="flex items-center gap-2"
						use:enhance={() => {
							return async ({ update }) => {
								isEditing = false;
								update();
							};
						}}
					>
						<input
							type="text"
							class="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
							bind:value={$form.name}
							name="name"
						/>
						<div class="flex gap-2">
							<button
								type="submit"
								class="cursor-pointer rounded-full border border-transparent bg-gray-50 p-2 text-gray-500 hover:border-gray-500 hover:bg-gray-100"
							>
								<IconCheck class="size-4" />
							</button>
							<button
								type="button"
								class="cursor-pointer rounded-full border border-transparent bg-gray-50 p-2 text-gray-500 hover:border-gray-500 hover:bg-gray-100"
								onclick={() => (isEditing = false)}
							>
								<IconX class="size-4" />
							</button>
						</div>
					</form>
				{:else}
					<div class="flex items-center gap-2">
						{data.group.name}
						<IconEdit
							class="size-4 cursor-pointer text-gray-500 hover:text-gray-700"
							onclick={() => (isEditing = true)}
						/>
					</div>
				{/if}
			</h1>

			<div class="mt-4 border-b border-gray-200">
				<nav class="-mb-px flex gap-6" aria-label="Group navigation">
					<a
						href="/groups/{page.params.groupId}"
						class="inline-flex shrink-0 items-center gap-2 border-b-2 px-3 pb-2 text-sm font-medium {currentPath ===
						`/groups/${page.params.groupId}`
							? 'border-gray-500 text-gray-800'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						aria-current={currentPath === `/groups/${page.params.groupId}` ? 'page' : undefined}
					>
						<IconUsers class="size-5" />
						Overview
					</a>
					<a
						href="/groups/{page.params.groupId}/history"
						class="inline-flex shrink-0 items-center gap-2 border-b-2 px-3 pb-2 text-sm font-medium {currentPath ===
						`/groups/${page.params.groupId}/history`
							? 'border-gray-500 text-gray-800'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						aria-current={currentPath === `/groups/${page.params.groupId}/history`
							? 'page'
							: undefined}
					>
						<IconHistory class="size-5" />
						History
					</a>
					<a
						href="/groups/{page.params.groupId}/settings"
						class="inline-flex shrink-0 items-center gap-2 border-b-2 px-3 pb-2 text-sm font-medium {currentPath ===
						`/groups/${page.params.groupId}/settings`
							? 'border-gray-500 text-gray-800'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						aria-current={currentPath === `/groups/${page.params.groupId}/settings`
							? 'page'
							: undefined}
					>
						<IconSettings class="size-5" />
						Settings
					</a>
				</nav>
			</div>
		</header>

		{@render children()}
	</div>
{/if}
