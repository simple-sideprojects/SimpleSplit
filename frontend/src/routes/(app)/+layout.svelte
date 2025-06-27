<script lang="ts">
	import { afterNavigate, invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import { AddTransactionButton, MobileNavigation } from '$lib';
	import type { GroupExpandedResponse, UserResponse } from '$lib/client';
	import { isCompiledStatic, onLayoutLoad } from '$lib/shared/app/controller.js';
	import { authStore } from '$lib/shared/stores/auth.store.js';
	import { groupsStore } from '$lib/shared/stores/groups.store.js';
	import type { ActionResult } from '@sveltejs/kit';
	import { onMount } from 'svelte';
	import IconDashboard from '~icons/tabler/dashboard';
	import IconPlus from '~icons/tabler/plus';
	import IconSettings from '~icons/tabler/settings';
	import IconUser from '~icons/tabler/user';
	import IconUsers from '~icons/tabler/users';
	import type { PageData } from './$types';

	//Handle provided data
	let { data, children } = $props<{ data: PageData }>();
	let groups: GroupExpandedResponse[] = $derived(Object.values($groupsStore));
	let user: UserResponse | null = $derived($authStore.user);

	//Update groups store if it is available through server load()
	$effect(() => {
		if (data.groups !== undefined) {
			groupsStore.setGroups(data.groups);
		}
	});

	//Update user store if it is available through server load()
	$effect(() => {
		if (data.user !== undefined) {
			$authStore.user = data.user;
		}
	});

	//ScrollToTop
	let mainElement: HTMLElement;
	afterNavigate(() => {
		mainElement?.scrollTo(0, 0);
	});

	//Check if the current page is a group page
	function isGroupPage(groupId: string): boolean {
		return (
			page.url.pathname == '/groups/dashboard/' && page.url.searchParams.get('groupId') == groupId
		);
	}

	//Mobile App functionality
	onMount(async () => {
		if (!isCompiledStatic()) {
			return;
		}

		const serverResponse: ActionResult = await onLayoutLoad('/', true);

		if (serverResponse.type !== 'success' || !serverResponse.data) {
			return;
		}

		$authStore.user = serverResponse.data.user;
		groupsStore.setGroups(serverResponse.data.groups);
	});
</script>

<div class="relative flex h-screen flex-col overflow-hidden sm:min-h-screen sm:flex-row">
	<div
		class="sticky top-0 hidden h-screen w-64 flex-col justify-between border-e border-gray-100 bg-white sm:flex"
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
							.pathname === '/'
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
								href="/groups/dashboard/?groupId={group.id}"
								onclick={() => {
									invalidate(`/groups/dashboard/?groupId=${group.id}`);
								}}
								class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium {group.id !==
									undefined && isGroupPage(group.id)
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
							<strong class="block font-medium">
								{user ? user.username : ''}
							</strong>
							<span>{user ? user.email : ''}</span>
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
	<main
		class="relative min-h-[calc(100vh-4rem)] overflow-auto px-4 py-8 pb-20 sm:flex-1 sm:p-8 sm:pb-20"
		bind:this={mainElement}
	>
		{@render children()}

		{#if page.url.pathname !== '/account'}
			<AddTransactionButton groups={data.groups} user={data.user} />
		{/if}
	</main>

	<MobileNavigation />
</div>
