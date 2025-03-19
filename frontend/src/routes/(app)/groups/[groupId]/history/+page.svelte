<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { EditTransactionDialog, Pagination, TransactionComponent } from '$lib';
	import type { ITransaction } from '$lib/interfaces';

	let { data } = $props();

	let transactions = $state<ITransaction[]>([]);
	let totalTransactions = $state(0);
	let currentPage = $state(1);
	let itemsPerPage = $state(25);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let selectedTransaction = $state<ITransaction | null>(null);
	let openEditDialog = $state<() => void>(() => {});

	async function fetchTransactions(page: number, limit: number) {
		isLoading = true;
		error = null;

		try {
			const [transactionsRes, totalRes] = await Promise.all([
				fetch(
					`${env.PUBLIC_BACKEND_URL}/api/groups/${data.group.id}/transactions?page=${page}&limit=${limit}`
				),
				fetch(`${env.PUBLIC_BACKEND_URL}/api/groups/${data.group.id}/transactions/total`)
			]);

			if (!transactionsRes.ok || !totalRes.ok) {
				throw new Error('Failed to fetch transactions');
			}

			transactions = await transactionsRes.json();
			totalTransactions = await totalRes.json();
		} catch (e) {
			error = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			isLoading = false;
		}
	}

	async function handleEdit(transaction: ITransaction) {
		selectedTransaction = transaction;
		openEditDialog();
	}

	async function handleDelete(transaction: ITransaction) {
		if (!confirm('Are you sure you want to delete this transaction?')) {
			return;
		}

		try {
			const response = await fetch(
				`${env.PUBLIC_BACKEND_URL}/api/groups/${data.group.id}/transactions/${transaction.id}`,
				{
					method: 'DELETE'
				}
			);

			if (!response.ok) {
				throw new Error('Failed to delete transaction');
			}

			await fetchTransactions(currentPage, itemsPerPage);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete transaction';
		}
	}

	$effect(() => {
		fetchTransactions(currentPage, itemsPerPage);
	});

	function handlePageChange(newPage: number) {
		currentPage = newPage;
	}

	function handleItemsPerPageChange(newItemsPerPage: number) {
		itemsPerPage = newItemsPerPage;
		currentPage = 1;
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-semibold">Group History</h1>
	</div>

	{#if isLoading}
		<div class="flex justify-center">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
			></div>
		</div>
	{:else if error}
		<div class="rounded-lg bg-red-50 p-4 text-sm text-red-700">
			{error}
		</div>
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

			{#if totalTransactions > itemsPerPage}
				<Pagination
					{currentPage}
					totalPages={Math.ceil(totalTransactions / itemsPerPage)}
					{itemsPerPage}
					onPageChange={handlePageChange}
					onItemsPerPageChange={handleItemsPerPageChange}
				/>
			{/if}
		</div>
	{/if}
</div>

<EditTransactionDialog bind:openDialog={openEditDialog} transaction={selectedTransaction} />
