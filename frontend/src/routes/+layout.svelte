<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { ParaglideJS } from '@inlang/paraglide-sveltekit';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { Toaster } from 'svelte-sonner';
	import '../app.css';

	let { children } = $props();

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 1000 * 60 * 5, // 5 minutes
				retry: 2,
				refetchOnWindowFocus: false
			},
			mutations: {
				retry: 1
			}
		}
	});
</script>

<QueryClientProvider client={queryClient}>
	<ParaglideJS {i18n}>
		{@render children()}
		<Toaster richColors position="top-right" />
	</ParaglideJS>
</QueryClientProvider>
