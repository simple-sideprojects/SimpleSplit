<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { ParaglideJS } from '@inlang/paraglide-sveltekit';
	import { HydrationBoundary, QueryClientProvider } from '@tanstack/svelte-query';
	import type { Snippet } from 'svelte';
	import { Toaster } from 'svelte-sonner';
	import '../app.css';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<QueryClientProvider client={data.queryClient}>
	<HydrationBoundary state={data.dehydratedState}>
		<ParaglideJS {i18n}>
			{@render children()}
			<Toaster richColors position="top-right" />
		</ParaglideJS>
	</HydrationBoundary>
</QueryClientProvider>
