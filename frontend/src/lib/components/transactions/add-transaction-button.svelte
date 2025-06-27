<script lang="ts">
	import IconPlus from '~icons/tabler/plus';
	import AddTransactionDialog from './add-transaction-dialog.svelte';

	let { groups, user } = $props();
	let openDialog = $state<(() => void) | undefined>();
</script>

<button
	type="button"
	class="fixed right-6 bottom-20 flex cursor-pointer items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:right-6 sm:bottom-6"
	onclick={() => openDialog?.()}
>
	<IconPlus class="size-5" />
	Add Transaction
</button>

<AddTransactionDialog bind:openDialog {groups} {user} />
