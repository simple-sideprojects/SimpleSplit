<script lang="ts">
	import { superForm } from '$lib/shared/form/super-form.js';
	import IconLoader from '~icons/tabler/loader';
	import type { PageData } from './$types';

	const { data } = $props<{ data: PageData }>();

	let { form, submitting, enhance } = superForm(data.groupCreateForm);
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold">Create New Group</h1>

	<div class="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
		<form class="space-y-6" action="?/createGroup" method="POST" use:enhance>
			<div class="space-y-1">
				<div class="mb-3 flex flex-col">
					<label for="name" class="text-base font-medium text-gray-900">Group Name</label>
					<span class="text-sm text-gray-500">Choose a name for your group</span>
				</div>
				<input
					type="text"
					name="name"
					id="name"
					bind:value={$form.name}
					required
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm/6"
					placeholder="Enter group name"
				/>
			</div>

			<div class="flex justify-end">
				<button
					type="submit"
					disabled={$submitting}
					class="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
				>
					{#if $submitting}
						<div class="flex items-center gap-2">
							<IconLoader class="size-4 animate-spin" />
							<span>Creating...</span>
						</div>
					{:else}
						Create Group
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
