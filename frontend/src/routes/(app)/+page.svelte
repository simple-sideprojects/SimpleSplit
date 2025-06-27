<script lang="ts">
	import { TransactionComponent } from '$lib';
	import type { Balance, TransactionRead } from '$lib/client/types.gen.js';
	import { isCompiledStatic, onPageLoad } from '$lib/shared/app/controller.js';
	import { balancesStore } from '$lib/shared/stores/balances.store.js';
	import { transactionsStore } from '$lib/shared/stores/transactions.store.js';
	import type { ActionResult } from '@sveltejs/kit';
	import { onMount } from 'svelte';
	import IconArrowDown from '~icons/tabler/arrow-down';
	import IconArrowUp from '~icons/tabler/arrow-up';
	import IconChevronDown from '~icons/tabler/chevron-down';
	import IconClock from '~icons/tabler/clock';
	import type { PageData } from './$types';

	//Handle provided data
	let { data } = $props<{ data: PageData }>();
	let balance: Balance | undefined = $derived(data.balance);
	let transactions: TransactionRead[] = $derived(Object.values($transactionsStore));

	$effect(() => {
		if (balance !== undefined) {
			balancesStore.setBalance(balance);
		}
	});

	$effect(() => {
		if (data.transactions !== undefined) {
			transactionsStore.setTransactions(data.transactions);
		}
	});

	//Calculate balances from the user_balances array
	let totalOwedToMe = $derived(balance ? balance.total_owed_by_others : 0);
	let totalIOwe = $derived(balance ? balance.total_owed_to_others : 0);

	//Formatter
	const AmountFormatter = Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

	//Mobile App functionality
	onMount(async () => {
		if (!isCompiledStatic()) {
			return;
		}
		const serverResponse: ActionResult = await onPageLoad(true);

		if (serverResponse.type !== 'success' || !serverResponse.data) {
			return;
		}

		balancesStore.setBalance(serverResponse.data.balance);
		transactionsStore.setTransactions(serverResponse.data.transactions);
	});
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold">Dashboard</h1>

	<!-- Balance Overview -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		<div class="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
			<div class="flex items-center gap-2">
				<IconArrowUp class="size-5 text-green-500" />
				<h2 class="text-base font-semibold text-gray-900">You are owed</h2>
			</div>
			<p class="mt-2 text-2xl font-bold text-green-500">
				{AmountFormatter.format(totalOwedToMe / 100)}
			</p>
		</div>

		<div class="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
			<div class="flex items-center gap-2">
				<IconArrowDown class="size-5 text-red-500" />
				<h2 class="text-base font-semibold text-gray-900">You owe</h2>
			</div>
			<p class="mt-2 text-2xl font-bold text-red-500">
				{AmountFormatter.format(totalIOwe / 100)}
			</p>
		</div>
	</div>

	<!-- Individual Balances -->
	{#if balance && balance.user_balances && balance.user_balances.length > 0}
		<div class="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
			<h2 class="mb-4 text-lg font-semibold">Individual Balances</h2>
			<div class="space-y-3">
				{#each balance.user_balances as userBalance (userBalance.user.id)}
					<div class="flex items-center justify-between rounded-lg border border-gray-100 p-3">
						<span class="font-medium">{userBalance.user.username}</span>
						<span class={userBalance.balance >= 0 ? 'text-green-500' : 'text-red-500'}>
							{AmountFormatter.format(userBalance.balance / 100)}
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Recent Transactions -->
	<details class="group rounded-lg border border-gray-100 bg-white shadow-sm" open>
		<summary
			class="flex w-full cursor-pointer items-center justify-between p-6 marker:content-none"
		>
			<div class="flex items-center gap-2">
				<IconClock class="size-5 text-gray-500" />
				<h2 class="text-lg font-semibold">Recent Transactions</h2>
			</div>
			<IconChevronDown
				class="size-5 text-gray-500 transition-transform duration-200 group-open:rotate-180"
			/>
		</summary>

		<div class="border-t border-gray-100">
			{#each transactions as transaction (transaction.id)}
				<div class="border-b border-gray-100 last:border-b-0">
					<TransactionComponent {transaction} />
				</div>
			{/each}
		</div>
	</details>
</div>
