<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { EditTransactionDialog, Pagination, TransactionComponent } from '$lib';
	import type { ITransaction } from '$lib/interfaces';
	import { isCompiledStatic, onPageLoad, triggerAction } from '$lib/shared/app/controller.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { building } from '$app/environment';
	import type { PageData } from './$types';
	import type { ActionResult } from '@sveltejs/kit';

	//Handle provided data
	let { data } = $props<{ data: PageData }>();
	const groupId =
		building || !page.url.searchParams.has('groupId')
			? null
			: (page.url.searchParams.get('groupId') as string);
	let transactions = $state<ITransaction[]>(data.transactions ?? []);
	let totalTransactions = $state(data.total ?? 0);
	let currentPage = $state(data.page ?? 1);
	let itemsPerPage = $state(data.limit ?? 25);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let selectedTransaction = $state<ITransaction | null>(null);
	let openEditDialog = $state<() => void>(() => {});

	//Fetch transactions
	interface ServerData extends Record<string, unknown> {
		transactions: ITransaction[];
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	}
	async function fetchTransactions(page: number, limit: number) {
		isLoading = true;
		error = null;

		const serverData: ActionResult<ServerData> = await triggerAction('transactions', {
			page: page,
			limit: limit
		});

		if (serverData.type !== 'success' || !serverData.data) {
			error = 'Failed to fetch transactions';
			isLoading = false;
			return;
		}

		transactions = serverData.data.transactions;
		totalTransactions = serverData.data.total;
		currentPage = serverData.data.page;
		itemsPerPage = serverData.data.limit;
		isLoading = false;
	}

	async function handleEdit(transaction: ITransaction) {
		selectedTransaction = transaction;
		openEditDialog();
	}

	async function handleDelete(transaction: ITransaction) {
		if (!confirm('Are you sure you want to delete this transaction?')) {
			return;
		}

		const serverData: ActionResult<any, any> = await triggerAction('delete', {
			id: transaction.id
		});

		if (serverData.type !== 'success') {
			error = 'Failed to delete transaction';
			return;
		}

		await fetchTransactions(currentPage, itemsPerPage);
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

	//Mobile App functionality
	onMount(async () => {
		if (!isCompiledStatic()) {
			return;
		}

		if (!groupId) {
			goto('/groups');
		}

		const serverResponse: ActionResult<ServerData> = await onPageLoad(true, {
			groupId: groupId
		});

		if (serverResponse.type !== 'success' || !serverResponse.data) {
			return;
		}

		transactions = serverResponse.data.transactions;
		totalTransactions = serverResponse.data.total;
		currentPage = serverResponse.data.page;
		itemsPerPage = serverResponse.data.limit;
	});
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
