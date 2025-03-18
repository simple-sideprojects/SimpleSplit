<script lang="ts">
	import { goto } from '$app/navigation';
	import { env } from '$env/dynamic/public';

	let name = '';
	let description = '';
	let isSubmitting = false;
	let error = '';

	async function handleSubmit(event: Event) {
		event.preventDefault();

		if (!name.trim()) {
			error = 'Please enter a group name';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			const response = await fetch(`${env.PUBLIC_BACKEND_URL}/api/groups`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name, description })
			});

			if (!response.ok) throw new Error('Failed to create group');

			const group = await response.json();
			goto(`/groups/${group.id}`);
		} catch (err) {
			console.error(err);
			error = 'Failed to create group. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold">Create New Group</h1>

	<div class="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
		<form class="space-y-6" onsubmit={handleSubmit}>
			<div class="space-y-1">
				<div class="mb-3 flex flex-col">
					<label for="name" class="text-base font-medium text-gray-900">Group Name</label>
					<span class="text-sm text-gray-500">Choose a name for your group</span>
				</div>
				<input
					type="text"
					name="name"
					id="name"
					bind:value={name}
					required
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm/6"
					placeholder="Enter group name"
				/>
			</div>

			<div class="space-y-1">
				<div class="mb-3 flex flex-col">
					<label for="description" class="text-base font-medium text-gray-900">Description</label>
					<span class="text-sm text-gray-500"
						>Brief description of the group's purpose and who should be in it</span
					>
				</div>
				<textarea
					name="description"
					id="description"
					bind:value={description}
					rows="3"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm/6"
					placeholder="Describe what this group is for..."
				></textarea>
			</div>

			{#if error}
				<div class="rounded-md bg-red-50 p-4">
					<p class="text-sm text-red-700">{error}</p>
				</div>
			{/if}

			<div class="flex justify-end">
				<button
					type="submit"
					disabled={isSubmitting}
					class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
				>
					{isSubmitting ? 'Creating...' : 'Create Group'}
				</button>
			</div>
		</form>
	</div>
</div>
