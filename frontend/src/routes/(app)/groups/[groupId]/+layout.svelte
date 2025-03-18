<script lang="ts">
	import { page } from '$app/state';
	import IconHistory from '~icons/tabler/history';
	import IconSettings from '~icons/tabler/settings';
	import IconUsers from '~icons/tabler/users';

	let { data, children } = $props();

	let currentPath = $derived(`${page.url.pathname}`);
</script>

<div>
	<header class="mb-8">
		<h1 class="text-2xl font-bold">{data.group.name}</h1>
		{#if data.group.description}
			<p class="mt-1 text-gray-500">{data.group.description}</p>
		{/if}

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
