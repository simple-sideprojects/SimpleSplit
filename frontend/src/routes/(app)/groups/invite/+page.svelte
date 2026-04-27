<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		acceptInviteInvitesAcceptTokenPutMutation,
		readGroupsGroupsGetQueryKey
	} from '$lib/client/@tanstack/svelte-query.gen';
	import { createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	const queryClient = useQueryClient();
	const acceptInvite = createMutation(acceptInviteInvitesAcceptTokenPutMutation());

	let message = $state('Your invite is being processed. Please wait...');

	onMount(async () => {
		const token = page.url.searchParams.get('token');

		if (!token) {
			await goto('/groups');
			return;
		}

		try {
			await $acceptInvite.mutateAsync({ path: { token } });
			await queryClient.invalidateQueries({ queryKey: readGroupsGroupsGetQueryKey() });
			toast.success('Invitation accepted');
			await goto('/groups');
		} catch {
			message = 'Failed to accept the invitation. The link may be invalid or already used.';
			toast.error('Failed to accept invitation');
		}
	});
</script>

<div>
	<p>{message}</p>
</div>
