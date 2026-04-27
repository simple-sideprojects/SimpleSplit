<script lang="ts">
	import { EditTransactionDialog, Pagination, TransactionComponent } from '$lib';
	import {
		deleteTransactionTransactionsTransactionIdDeleteMutation,
		readGroupGroupsGroupIdGetQueryKey,
		readGroupTransactionsGroupsGroupIdTransactionsGetQueryKey
	} from '$lib/client/@tanstack/svelte-query.gen';
	import type { TransactionRead } from '$lib/client/types.gen';
	import { groupTransactionsQueryOptions } from '$lib/query/options';
	import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	const { data } = $props<{ data: PageData }>();
	const groupId = $derived(data.groupId as string);

	let currentPage = $state(data.page ?? 1);
	let itemsPerPage = $state(data.limit ?? 25);

	const queryClient = useQueryClient();

	const transactionsQuery = $derived.by(() =>
		createQuery(
			groupTransactionsQueryOptions(groupId, {
				skip: (currentPage - 1) * itemsPerPage,
				limit: itemsPerPage
			})
		)
	);
	let transactions = $derived(($transactionsQuery.data ?? []) as TransactionRead[]);
	let isLoading = $derived($transactionsQuery.isLoading);
	let error = $derived($transactionsQuery.error?.message ?? null);

	const deleteTransaction = createMutation(
		deleteTransactionTransactionsTransactionIdDeleteMutation()
	);

	let selectedTransaction = $state<TransactionRead | null>(null);
	let openEditDialog = $state<() => void>(() => {});

	function handleEdit(transaction: TransactionRead) {
		selectedTransaction = transaction;
		openEditDialog();
	}

	async function handleDelete(transaction: TransactionRead) {
		if (!transaction.id) return;
		if (!confirm('Are you sure you want to delete this transaction?')) return;

		try {
			await $deleteTransaction.mutateAsync({ path: { transaction_id: transaction.id } });
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: readGroupTransactionsGroupsGroupIdTransactionsGetQueryKey({
						path: { group_id: groupId }
					})
				}),
				queryClient.invalidateQueries({
					queryKey: readGroupGroupsGroupIdGetQueryKey({ path: { group_id: groupId } })
				})
			]);
			toast.success('Transaction deleted');
		} catch {
			toast.error('Failed to delete transaction');
		}
	}

	function handlePageChange(newPage: number) {
		currentPage = newPage;
	}

	function handleItemsPerPageChange(newItemsPerPage: number) {
		itemsPerPage = newItemsPerPage;
		currentPage = 1;
	}

	// The backend doesn't expose a total count; use a heuristic page window.
	let hasMore = $derived(transactions.length >= itemsPerPage);
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-semibold">Group History</h1>
	</div>

	{#if isLoading}
		<div class="flex justify-center">
			<div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
		</div>
	{:else if error}
		<div class="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
	{:else if transactions.length === 0}
		<div class="rounded-lg border border-dashed border-gray-200 p-8 text-center">
			<p class="text-gray-500">No transactions found</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each transactions as transaction (transaction.id)}
				<div class="rounded-lg border border-gray-100">
					<TransactionComponent
						{transaction}
						showActions
						onEdit={handleEdit}
						onDelete={handleDelete}
					/>
				</div>
			{/each}

			{#if currentPage > 1 || hasMore}
				<Pagination
					{currentPage}
					totalPages={currentPage + (hasMore ? 1 : 0)}
					{itemsPerPage}
					onPageChange={handlePageChange}
					onItemsPerPageChange={handleItemsPerPageChange}
				/>
			{/if}
		</div>
	{/if}
</div>

<EditTransactionDialog bind:openDialog={openEditDialog} transaction={selectedTransaction} />
