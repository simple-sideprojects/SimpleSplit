<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { EditTransactionDialog, Pagination, TransactionComponent } from '$lib';
	import type { TransactionRead } from '$lib/client';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	//Handle provided data
	let { data } = $props<{ data: PageData }>();
	let transactions = $state<TransactionRead[]>(data.transactions ?? []);
	let totalTransactions = $state(data.total ?? 0);
	let currentPage = $state(data.page ?? 1);
	let itemsPerPage = $state(data.limit ?? 25);
	let error = $state<string | null>(null);
	let selectedTransaction = $state<TransactionRead | null>(null);
	let openEditDialog = $state<() => void>(() => {});
	let groupId = $derived(page.url.searchParams.get('groupId'));

	//Update local state when data changes
	$effect(() => {
		transactions = data.transactions ?? [];
		totalTransactions = data.total ?? 0;
		currentPage = data.page ?? 1;
		itemsPerPage = data.limit ?? 25;
	});

	async function handleEdit(transaction: TransactionRead) {
		selectedTransaction = transaction;
		openEditDialog();
	}

	async function handleDelete(transaction: TransactionRead) {
		if (!confirm('Are you sure you want to delete this transaction?')) {
			return;
		}

		if (!groupId) {
			error = 'Missing group ID';
			return;
		}

		if (!transaction.id) {
			error = 'Missing transaction ID';
			return;
		}

		error = null;
		// Use standard form submission to delete action
		const formData = new FormData();
		formData.append('id', transaction.id);
		formData.append('groupId', groupId);

		const response = await fetch(`?/delete`, {
			method: 'POST',
			body: formData,
			headers: {
				'x-sveltekit-action': 'true'
			}
		});

		if (!response.ok) {
			error = 'Failed to delete transaction';
			return;
		}

		// Refresh the data
		await invalidateAll();
	}

	function handlePageChange(newPage: number) {
		const url = new URL(page.url);
		url.searchParams.set('page', newPage.toString());
		goto(url.toString());
	}

	function handleItemsPerPageChange(newItemsPerPage: number) {
		const url = new URL(page.url);
		url.searchParams.set('limit', newItemsPerPage.toString());
		url.searchParams.set('page', '1');
		goto(url.toString());
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-semibold">Group History</h1>
	</div>

	{#if error}
		<div class="rounded-lg bg-red-50 p-4 text-sm text-red-700">
			{error}
		</div>
	{/if}

	{#if transactions.length === 0}
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
