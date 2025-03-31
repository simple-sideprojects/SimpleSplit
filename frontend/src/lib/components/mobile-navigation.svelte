<script lang="ts">
	import { page } from '$app/state';
	import IconDashboard from '~icons/tabler/dashboard';
	import IconSettings from '~icons/tabler/settings';
	import IconUsers from '~icons/tabler/users';
</script>

<nav class="z-50 h-16 border-t border-gray-200 bg-white sm:hidden">
	<div class="grid h-16 grid-cols-3">
		<a
			href="/"
			class="flex flex-col items-center justify-center {page.url.pathname === '/'
				? 'text-blue-600'
				: 'text-gray-500'}"
		>
			<IconDashboard class="size-6" />
			<span class="mt-1 text-xs">Dashboard</span>
		</a>

		<a
			href="/groups"
			class="flex flex-col items-center justify-center {page.url.pathname.startsWith('/groups')
				? 'text-blue-600'
				: 'text-gray-500'}"
		>
			<IconUsers class="size-6" />
			<span class="mt-1 text-xs">Groups</span>
		</a>

		<a
			href="/account"
			class="flex flex-col items-center justify-center {page.url.pathname.startsWith('/account')
				? 'text-blue-600'
				: 'text-gray-500'}"
		>
			<IconSettings class="size-6" />
			<span class="mt-1 text-xs">Account</span>
		</a>
	</div>
</nav>
