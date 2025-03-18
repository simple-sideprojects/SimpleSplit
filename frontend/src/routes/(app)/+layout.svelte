<script lang="ts">
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import { AddTransactionButton } from '$lib';
	import type { Group } from '$lib/interfaces';
	import { onMount } from 'svelte';
	import IconDashboard from '~icons/tabler/dashboard';
	import IconPlus from '~icons/tabler/plus';
	import IconSettings from '~icons/tabler/settings';
	import IconUser from '~icons/tabler/user';
	import IconUsers from '~icons/tabler/users';

	let { children } = $props();

	let groups: Group[] = $state([]);

	onMount(async () => {
		const response = await fetch(`${env.PUBLIC_BACKEND_URL}/api/groups`);
		groups = await response.json();
	});
</script>

<div class="flex min-h-screen">
	<div
		class="sticky top-0 flex h-screen w-64 flex-col justify-between border-e border-gray-100 bg-white"
	>
		<div class="px-4 py-6">
			<div class="flex items-center gap-2">
				<img
					src="/simple-sideprojects.webp"
					alt="Logo"
					class="h-10 w-10 rounded-md bg-gray-100 p-1"
				/>
				<span class="text-lg font-bold">Simple/Split</span>
			</div>

			<ul class="mt-6 space-y-1">
				<li>
					<a
						href="/"
						class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium {page.url
							.pathname === '/dashboard'
							? 'bg-gray-100 text-gray-700'
							: 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}"
					>
						<IconDashboard class="size-5" />
						Dashboard
					</a>
				</li>

				<li class="pt-2">
					<div class="flex items-center justify-between px-4">
						<div class="flex items-center gap-2 text-sm font-semibold text-gray-500">
							<IconUsers class="size-5" />
							Your Groups
						</div>
						<a
							href="/groups/create"
							class="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
							title="Create New Group"
						>
							<IconPlus class="size-4" />
						</a>
					</div>
					<div class="mt-2 space-y-1">
						{#each groups as group (group.id)}
							<a
								href="/groups/{group.id}"
								class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium {page.url.pathname.startsWith(
									`/groups/${group.id}`
								)
									? 'bg-gray-100 text-gray-700'
									: 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}"
							>
								{group.name}
							</a>
						{/each}

						{#if groups.length === 0}
							<div class="px-6 py-1 text-sm text-gray-500">
								No groups yet. Create your first group to get started!
							</div>
						{/if}
					</div>
				</li>
			</ul>
		</div>

		<div class="sticky inset-x-0 bottom-0 border-t border-gray-100">
			<div class="flex items-center justify-between bg-white p-4 hover:bg-gray-50">
				<div class="flex items-center gap-2">
					<div class="flex size-10 items-center justify-center rounded-full bg-gray-100">
						<IconUser class="size-6 text-gray-500" />
					</div>

					<div>
						<p class="text-xs">
							<strong class="block font-medium">Max Mustermann</strong>
							<span>max@mustermann.de</span>
						</p>
					</div>
				</div>

				<a href="/account" class="rounded-lg p-2 hover:bg-gray-100">
					<IconSettings class="size-5 text-gray-500" />
				</a>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="flex-1 p-8">
		{@render children()}
	</div>
</div>

<AddTransactionButton />
