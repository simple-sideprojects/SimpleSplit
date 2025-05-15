<script lang="ts">
	import IconPlus from '~icons/tabler/plus';
	import type { Group } from '$lib/client';
	import { groupsStore } from '$lib/shared/stores/groups.store.js';
	
	//Handle provided data
	let { data } = $props();
	let groups: Group[] = $derived(data.groups ?? Object.values($groupsStore) ?? []);
</script>

<div class="mx-auto w-full max-w-4xl">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">Your Groups</h1>
		<a
			href="/groups/create"
			class="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
		>
			<IconPlus class="size-4" />
			New Group
		</a>
	</div>

	{#if groups.length > 0}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each groups as group (group.id)}
				<a
					href="/groups/{group.id}"
					class="block rounded-lg border border-gray-200 p-4 hover:border-blue-500 hover:shadow-sm"
				>
					<h2 class="text-lg font-semibold text-gray-900">{group.name}</h2>
				</a>
			{/each}
		</div>
	{:else}
		<div class="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
			<p class="text-gray-600">You haven't created any groups yet.</p>
			<a
				href="/groups/create"
				class="mt-4 inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
			>
				<IconPlus class="size-4" />
				Create Your First Group
			</a>
		</div>
	{/if}
</div>
