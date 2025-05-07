<script lang="ts">
	import { building } from '$app/environment';
	import { goto } from '$app/navigation';
	import { TransactionComponent } from '$lib';
	import type { Group } from '$lib/client/types.gen.js';
	import { isCompiledStatic, onPageLoad } from '$lib/shared/app/controller.js';
	import { onMount } from 'svelte';
	import IconArrowDown from '~icons/tabler/arrow-down';
	import IconArrowUp from '~icons/tabler/arrow-up';
	import IconChevronDown from '~icons/tabler/chevron-down';
	import IconClock from '~icons/tabler/clock';

	type Balance = {
		username: string;
		balance: number;
	};

	let { data } = $props();

	let balances: Balance[] = $state(data.balances ?? []);
	let transactions: [] = $state(data.transactions ?? []);
	let user = $state(data.user ?? {
		username: '',
		email: ''
	});
	let groups: Group[] = $state(data.groups ?? []);

	let totalPositive = $derived(
		balances.reduce((acc: number, b: Balance) => (b.balance > 0 ? acc + b.balance : acc), 0)
	);
	let totalNegative = $derived(
		balances.reduce((acc: number, b: Balance) => (b.balance < 0 ? acc + b.balance : acc), 0)
	);

	function formatAmount(amount: number): string {
		return (amount / 100).toFixed(2);
	}

	//Mobile App functionality
	onMount(async () => {
		if(!isCompiledStatic()){
			return;
		}
		const serverData : {
			balances: Balance[],
			transactions: [],
			user: {
				username: string,
				email: string
			},
			groups: Group[]
		}|null = await onPageLoad(true, true);
		if(serverData === null){
			return;
		}

		balances = serverData.balances;
		transactions = serverData.transactions;
		user = serverData.user;
		groups = serverData.groups;
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
			<p class="mt-2 text-2xl font-bold text-green-500">€{formatAmount(totalPositive)}</p>
		</div>

		<div class="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
			<div class="flex items-center gap-2">
				<IconArrowDown class="size-5 text-red-500" />
				<h2 class="text-base font-semibold text-gray-900">You owe</h2>
			</div>
			<p class="mt-2 text-2xl font-bold text-red-500">€{formatAmount(Math.abs(totalNegative))}</p>
		</div>
	</div>

	<!-- Individual Balances -->
	<div class="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-lg font-semibold">Individual Balances</h2>
		<div class="space-y-3">
			{#each balances as balance (balance.username)}
				<div class="flex items-center justify-between rounded-lg border border-gray-100 p-3">
					<span class="font-medium">{balance.username}</span>
					<span class={balance.balance >= 0 ? 'text-green-500' : 'text-red-500'}>
						€{formatAmount(balance.balance)}
					</span>
				</div>
			{/each}
		</div>
	</div>

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
