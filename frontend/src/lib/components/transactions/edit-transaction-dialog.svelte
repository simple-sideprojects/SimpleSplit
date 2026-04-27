<script lang="ts">
	import {
		getUserBalancesBalancesGetQueryKey,
		readGroupGroupsGroupIdGetQueryKey,
		readGroupTransactionsGroupsGroupIdTransactionsGetQueryKey,
		readTransactionsUserIsParticipantInTransactionsGetQueryKey,
		updateTransactionTransactionsTransactionIdPutMutation
	} from '$lib/client/@tanstack/svelte-query.gen';
	import type { TransactionRead, TransactionType } from '$lib/client/types.gen';
	import { groupQueryOptions } from '$lib/query/options';
	import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import IconLoader from '~icons/tabler/loader';
	import IconX from '~icons/tabler/x';

	let {
		openDialog = $bindable(),
		transaction
	}: {
		openDialog?: () => void;
		transaction: TransactionRead | null;
	} = $props();

	let dialog: HTMLDialogElement;
	let title = $state('');
	let amount = $state('');
	let purchasedDate = $state('');
	let splitType = $state<TransactionType>('EVEN');
	let payerId = $state<string | null>(null);
	let error = $state<string | null>(null);

	const queryClient = useQueryClient();
	const updateTxn = createMutation(updateTransactionTransactionsTransactionIdPutMutation());

	// Fetch the group's full member list so the payer dropdown is editable.
	const groupQuery = $derived.by(() => {
		const id = transaction?.group_id;
		return id
			? createQuery({ ...groupQueryOptions(id), enabled: !!id })
			: createQuery({ queryKey: ['edit-noop'], queryFn: async () => null, enabled: false });
	});
	let groupMembers = $derived($groupQuery.data?.users ?? []);

	openDialog = () => {
		if (!transaction) return;
		title = transaction.title;
		amount = (transaction.amount / 100).toFixed(2);
		purchasedDate = transaction.purchased_on
			? new Date(transaction.purchased_on).toISOString().split('T')[0]
			: '';
		splitType = transaction.transaction_type ?? 'EVEN';
		payerId = transaction.payer_id;
		error = null;
		dialog.showModal();
	};

	function closeDialog() {
		dialog.close();
		resetForm();
	}

	function handleClickOutside(event: MouseEvent) {
		const rect = dialog.getBoundingClientRect();
		const isInDialog =
			rect.top <= event.clientY &&
			event.clientY <= rect.top + rect.height &&
			rect.left <= event.clientX &&
			event.clientX <= rect.left + rect.width;
		if (!isInDialog) dialog.close();
	}

	function resetForm() {
		title = '';
		amount = '';
		purchasedDate = '';
		splitType = 'EVEN';
		payerId = null;
		error = null;
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!transaction?.id) return;

		error = null;

		if (!title || !amount) {
			error = 'Please fill in all fields';
			return;
		}

		const amountInCents = Math.round(parseFloat(amount) * 100);
		if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
			error = 'Amount must be greater than 0';
			return;
		}

		try {
			await $updateTxn.mutateAsync({
				path: { transaction_id: transaction.id },
				body: {
					title,
					amount: amountInCents,
					purchased_on: purchasedDate ? new Date(purchasedDate).toISOString() : undefined,
					transaction_type: splitType,
					payer_id: payerId
				}
			});

			const groupId = transaction.group_id;
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: getUserBalancesBalancesGetQueryKey() }),
				queryClient.invalidateQueries({
					queryKey: readTransactionsUserIsParticipantInTransactionsGetQueryKey()
				}),
				queryClient.invalidateQueries({
					queryKey: readGroupGroupsGroupIdGetQueryKey({ path: { group_id: groupId } })
				}),
				queryClient.invalidateQueries({
					queryKey: readGroupTransactionsGroupsGroupIdTransactionsGetQueryKey({
						path: { group_id: groupId }
					})
				})
			]);
			toast.success('Transaction updated');
			closeDialog();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update transaction';
		}
	}

	const isSubmitting = $derived($updateTxn.isPending);
</script>

<dialog
	bind:this={dialog}
	class="min-w-[400px] place-self-center rounded-lg border border-gray-100 bg-white p-6 shadow-lg backdrop:bg-black/25"
	onmousedown={handleClickOutside}
	onclose={closeDialog}
>
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold">Edit Transaction</h2>
		<button
			type="button"
			class="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
			onclick={closeDialog}
		>
			<IconX class="size-5" />
		</button>
	</div>

	<form class="mt-6 space-y-4" onsubmit={handleSubmit}>
		<div>
			<label for="edit-title" class="block text-sm font-medium text-gray-700">Title</label>
			<input
				type="text"
				id="edit-title"
				required
				class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				placeholder="Enter transaction title"
				bind:value={title}
			/>
		</div>

		<div>
			<label for="edit-amount" class="block text-sm font-medium text-gray-700">Amount (€)</label>
			<input
				type="number"
				id="edit-amount"
				bind:value={amount}
				step="0.01"
				min="0"
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				required
			/>
		</div>

		<div>
			<label for="edit-purchased_on" class="block text-sm font-medium text-gray-700">Purchased On</label>
			<input
				type="date"
				id="edit-purchased_on"
				bind:value={purchasedDate}
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
			/>
		</div>

		<div>
			<label for="edit-payer_id" class="block text-sm font-medium text-gray-700">Payer</label>
			<select
				id="edit-payer_id"
				bind:value={payerId}
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				required
			>
				{#if groupMembers.length > 0}
					{#each groupMembers as member (member.id)}
						<option value={member.id}>{member.username}</option>
					{/each}
				{:else if transaction?.payer}
					<option value={transaction.payer.id}>{transaction.payer.username}</option>
				{/if}
			</select>
		</div>

		<div>
			<label for="edit-split-type" class="block text-sm font-medium text-gray-700">Split Type</label>
			<div id="edit-split-type" class="mt-1 flex overflow-hidden rounded-md border border-gray-200">
				<button
					type="button"
					class={`flex-1 px-3 py-2 text-sm font-medium ${splitType === 'EVEN' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
					onclick={() => (splitType = 'EVEN')}
				>
					Even
				</button>
				<button
					type="button"
					class={`flex-1 px-3 py-2 text-sm font-medium ${splitType === 'AMOUNT' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
					onclick={() => (splitType = 'AMOUNT')}
				>
					Amount
				</button>
				<button
					type="button"
					class={`flex-1 px-3 py-2 text-sm font-medium ${splitType === 'PERCENTAGE' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
					onclick={() => (splitType = 'PERCENTAGE')}
				>
					Percentage
				</button>
			</div>
			<p class="mt-1 text-xs text-gray-500">
				Note: editing per-participant amounts isn't supported by the API — delete and re-create the
				transaction if you need to change the split.
			</p>
		</div>

		{#if error}
			<div class="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
		{/if}

		<div class="mt-6 flex justify-end gap-3">
			<button
				type="button"
				class="cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
				onclick={closeDialog}
			>
				Cancel
			</button>
			<button
				type="submit"
				disabled={isSubmitting}
				class="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
			>
				{#if isSubmitting}
					<div class="flex items-center gap-2">
						<IconLoader class="size-4 animate-spin" />
						<span>Saving...</span>
					</div>
				{:else}
					Save Changes
				{/if}
			</button>
		</div>
	</form>
</dialog>
