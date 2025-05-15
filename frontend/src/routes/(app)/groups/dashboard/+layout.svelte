<script lang="ts">
	import { page } from '$app/state';
	import type { Group } from '$lib/client/types.gen.js';
	import { isCompiledStatic, onLayoutLoad } from '$lib/shared/app/controller.js';
	import { onMount } from 'svelte';
	import IconCheck from '~icons/tabler/check';
	import IconEdit from '~icons/tabler/edit';
	import IconHistory from '~icons/tabler/history';
	import IconSettings from '~icons/tabler/settings';
	import IconUsers from '~icons/tabler/users';
	import IconX from '~icons/tabler/x';
	import { groupsStore } from '$lib/shared/stores/groups.store.js';
	import { building } from '$app/environment';
	import { superForm } from '$lib/shared/form/super-form.js';
	import { toast } from 'svelte-sonner';
	import { invalidate } from '$app/navigation';

	//Handle provided data
	let { data, children } = $props();
	const groupId = $derived(building || !page.url.searchParams.has('groupId') ? null : page.url.searchParams.get('groupId') as string);
	let group: Group|null = $derived(data.group ?? (groupId ? $groupsStore[groupId] : null) ?? null);

	// Derived from URL parameters
	/*$effect(() => {
		// Invalidate page data to force a reload
		invalidate(`app:groupDashboard:${groupId}`);
	});*/
	// Update groups when groupsStore changes
	/*$effect(() => {
		if(groupId){
			group = $groupsStore[groupId] ?? null;
		}
	});*/

	//Update Group Name Form
	const { 
		form, 
		enhance: enhanceUpdateGroupName
	} = superForm(data.updateGroupNameForm, {
		onResult: ({ result }) => {
			if (result.type === 'success' && result.data && result.data.group) {
				if(groupId){
					$groupsStore[groupId] = result.data.group;
					data.group = result.data.group;
				}
				isEditing = false;
				toast.success('Group name updated');
			}
		}
	});
	let isEditing = $state(false);

	//Path handling
	let currentPath = $derived(`${page.url.pathname}`);
	let pathType = $derived.by(() => {
		if (currentPath.includes('history')) {
			return 'history';
		}
		if (currentPath.includes('settings')) {
			return 'settings';
		}
		return 'dashboard';
	});

	//Mobile App functionality
	onMount(async () => {
		if(!isCompiledStatic()){
			return;
		}

		const serverData : {
			group: Group,
			updateGroupNameForm: any
		}|null = await onLayoutLoad('/groups/dashboard/', true, true, {
			groupId
		});

		if(serverData === null){
			return;
		}

		//Update the group in the store
		groupsStore.updateGroup(serverData.group);

		//Update the data of the form
		form.update(() => ({
			name: serverData.group.name
		}))
	});
</script>

{#if group}
	<div>
		<header class="mb-8">
			<h1 class="text-2xl font-bold">
				{#if isEditing}
					<form
						action="/groups/dashboard/settings?/updateGroupName"
						method="POST"
						class="flex items-center gap-2"
						use:enhanceUpdateGroupName
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
						{group.name}
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
						href="/groups/dashboard?groupId={groupId}"
						class="inline-flex shrink-0 items-center gap-2 border-b-2 px-3 pb-2 text-sm font-medium {pathType === 'dashboard'
							? 'border-gray-500 text-gray-800'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						aria-current={pathType === 'dashboard' ? 'page' : undefined}
					>
						<IconUsers class="size-5" />
						Overview
					</a>
					<a
						href="/groups/dashboard/history?groupId={groupId}"
						class="inline-flex shrink-0 items-center gap-2 border-b-2 px-3 pb-2 text-sm font-medium {pathType === 'history'
							? 'border-gray-500 text-gray-800'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						aria-current={pathType === 'history' ? 'page' : undefined}
					>
						<IconHistory class="size-5" />
						History
					</a>
					<a
						href="/groups/dashboard/settings?groupId={groupId}"
						class="inline-flex shrink-0 items-center gap-2 border-b-2 px-3 pb-2 text-sm font-medium {pathType === 'settings'
							? 'border-gray-500 text-gray-800'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						aria-current={pathType === 'settings' ? 'page' : undefined}
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
