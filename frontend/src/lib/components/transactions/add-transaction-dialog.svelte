<script lang="ts">
	import {
		createTransactionTransactionsPostMutation,
		getUserBalancesBalancesGetQueryKey,
		readGroupGroupsGroupIdGetQueryKey,
		readGroupTransactionsGroupsGroupIdTransactionsGetQueryKey,
		readTransactionsUserIsParticipantInTransactionsGetQueryKey
	} from '$lib/client/@tanstack/svelte-query.gen';
	import type {
		Group,
		TransactionParticipantCreate,
		TransactionType,
		UserResponse
	} from '$lib/client/types.gen';
	import { groupQueryOptions } from '$lib/query/options';
	import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import IconLoader from '~icons/tabler/loader';
	import IconX from '~icons/tabler/x';

	let {
		groups,
		openDialog = $bindable(),
		user
	}: {
		groups: Group[] | undefined;
		openDialog?: () => void;
		user: UserResponse | null;
	} = $props();

	let dialog: HTMLDialogElement;
	let title = $state('');
	let amountStr = $state('');
	let payerId = $state<string | null>(null);
	let selectedGroup = $state<string | null>(null);
	let splitType = $state<TransactionType>('EVEN');
	let selectedParticipants = $state<Set<string>>(new Set());
	let participantAmounts = $state<Map<string, string>>(new Map());
	let purchasedDate = $state(new Date().toISOString().split('T')[0]);
	let participantsError = $state<string | null>(null);
	let formError = $state<string | null>(null);

	const queryClient = useQueryClient();

	// Pull the group with users on demand once the user picks one.
	const groupDetailsQuery = $derived.by(() => {
		const id = selectedGroup;
		return id
			? createQuery({ ...groupQueryOptions(id), enabled: !!id })
			: createQuery({ queryKey: ['noop-group'], queryFn: async () => null, enabled: false });
	});
	let groupWithUsers = $derived($groupDetailsQuery.data ?? null);

	const createTxn = createMutation(createTransactionTransactionsPostMutation());

	$effect(() => {
		// When the loaded group changes, reset participants to "all members" and
		// pre-fill the payer with the current user.
		if (groupWithUsers && groupWithUsers.id === selectedGroup) {
			selectedParticipants = new Set();
			participantAmounts.clear();
			for (const member of groupWithUsers.users ?? []) {
				if (member.id) selectedParticipants.add(member.id);
			}
			if (user?.id) payerId = user.id;
			participantsError = null;
		}
	});

	$effect(() => {
		// Splitting evenly clears the per-person amount inputs; other modes
		// initialise blank inputs for any newly-selected participants.
		if (splitType === 'EVEN') {
			participantAmounts.clear();
		} else {
			for (const userId of selectedParticipants) {
				if (!participantAmounts.has(userId)) participantAmounts.set(userId, '');
			}
		}
		participantsError = null;
	});

	openDialog = () => dialog.showModal();

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
		amountStr = '';
		payerId = null;
		selectedGroup = null;
		splitType = 'EVEN';
		selectedParticipants = new Set();
		participantAmounts.clear();
		participantsError = null;
		formError = null;
		purchasedDate = new Date().toISOString().split('T')[0];
	}

	function toggleParticipant(userId: string) {
		if (selectedParticipants.has(userId)) {
			selectedParticipants.delete(userId);
			participantAmounts.delete(userId);
		} else {
			selectedParticipants.add(userId);
			if (splitType !== 'EVEN') participantAmounts.set(userId, '');
		}
		// Force reactivity (Set/Map mutations don't re-trigger by themselves)
		selectedParticipants = new Set(selectedParticipants);
		participantsError = null;
	}

	function calculateTotal() {
		if (splitType === 'AMOUNT') {
			let total = 0;
			for (const id of selectedParticipants) {
				const v = parseFloat(participantAmounts.get(id) || '0');
				if (!isNaN(v)) total += v;
			}
			return total.toFixed(2) + '€';
		}
		if (splitType === 'PERCENTAGE') {
			let total = 0;
			for (const id of selectedParticipants) {
				const v = parseFloat(participantAmounts.get(id) || '0');
				if (!isNaN(v)) total += v;
			}
			return total.toFixed(2) + '%';
		}
		return null;
	}

	function buildParticipants(amountInCents: number): TransactionParticipantCreate[] | string {
		const participants: TransactionParticipantCreate[] = [];

		if (splitType === 'EVEN') {
			const per = Math.round(amountInCents / selectedParticipants.size);
			for (const id of selectedParticipants) participants.push({ debtor_id: id, amount_owed: per });
			return participants;
		}

		if (splitType === 'AMOUNT') {
			let total = 0;
			for (const id of selectedParticipants) {
				const v = parseFloat(participantAmounts.get(id) || '0');
				if (isNaN(v)) return 'Please enter a valid amount for all participants';
				total += Math.round(v * 100);
			}
			if (total !== amountInCents) {
				return `Total amounts (${(total / 100).toFixed(2)}€) don't match transaction amount (${(amountInCents / 100).toFixed(2)}€)`;
			}
			for (const id of selectedParticipants) {
				const v = parseFloat(participantAmounts.get(id) || '0');
				participants.push({ debtor_id: id, amount_owed: Math.round(v * 100) });
			}
			return participants;
		}

		// PERCENTAGE
		let totalPct = 0;
		for (const id of selectedParticipants) {
			const v = parseFloat(participantAmounts.get(id) || '0');
			if (isNaN(v)) return 'Please enter a valid percentage for all participants';
			totalPct += v;
		}
		if (Math.abs(totalPct - 100) > 0.01) {
			return `Total percentage (${totalPct.toFixed(2)}%) doesn't add up to 100%`;
		}
		for (const id of selectedParticipants) {
			const pct = parseFloat(participantAmounts.get(id) || '0');
			participants.push({
				debtor_id: id,
				amount_owed: Math.round((pct / 100) * amountInCents)
			});
		}
		return participants;
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		formError = null;
		participantsError = null;

		if (!selectedGroup || !payerId || selectedParticipants.size === 0 || !title || !amountStr) {
			formError = 'Please fill in all required fields';
			return;
		}

		const amountInCents = Math.round(parseFloat(amountStr) * 100);
		if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
			formError = 'Amount must be greater than 0';
			return;
		}

		const built = buildParticipants(amountInCents);
		if (typeof built === 'string') {
			participantsError = built;
			return;
		}

		try {
			await $createTxn.mutateAsync({
				body: {
					group_id: selectedGroup,
					payer_id: payerId,
					title,
					amount: amountInCents,
					purchased_on: purchasedDate ? new Date(purchasedDate).toISOString() : undefined,
					transaction_type: splitType,
					participants: built
				}
			});
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: getUserBalancesBalancesGetQueryKey() }),
				queryClient.invalidateQueries({
					queryKey: readTransactionsUserIsParticipantInTransactionsGetQueryKey()
				}),
				queryClient.invalidateQueries({
					queryKey: readGroupGroupsGroupIdGetQueryKey({ path: { group_id: selectedGroup } })
				}),
				queryClient.invalidateQueries({
					queryKey: readGroupTransactionsGroupsGroupIdTransactionsGetQueryKey({
						path: { group_id: selectedGroup }
					})
				})
			]);
			toast.success('Transaction added successfully');
			closeDialog();
		} catch (e) {
			toast.error('Failed to add transaction');
			formError = e instanceof Error ? e.message : 'Failed to add transaction';
		}
	}

	const submitting = $derived($createTxn.isPending);
	const loading = $derived(!!selectedGroup && $groupDetailsQuery.isLoading);
</script>

<dialog
	bind:this={dialog}
	class="min-w-[95%] place-self-center rounded-lg border border-gray-100 bg-white p-6 shadow-lg backdrop:bg-black/25 sm:min-w-[500px]"
	onmousedown={handleClickOutside}
	onclose={closeDialog}
>
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold">Add Transaction</h2>
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
			<label for="title" class="block text-sm font-medium text-gray-700">Title</label>
			<input
				type="text"
				id="title"
				bind:value={title}
				required
				class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				placeholder="Enter transaction title"
			/>
		</div>

		<div>
			<label for="amount" class="block text-sm font-medium text-gray-700">Amount (€)</label>
			<input
				type="number"
				id="amount"
				bind:value={amountStr}
				step="0.01"
				min="0"
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				required
			/>
		</div>

		<div>
			<label for="purchased_on" class="block text-sm font-medium text-gray-700">Purchased On</label>
			<div class="relative mt-1">
				<input
					type="date"
					id="purchased_on"
					bind:value={purchasedDate}
					class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				/>
			</div>
		</div>

		<div>
			<label for="group_id" class="block text-sm font-medium text-gray-700">Group</label>
			<select
				id="group_id"
				bind:value={selectedGroup}
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				required
			>
				<option value={null} disabled selected>Select a group</option>
				{#each groups ?? [] as group (group.id)}
					<option value={group.id}>{group.name}</option>
				{/each}
			</select>
		</div>

		{#if groupWithUsers}
			<div>
				<label for="payer_id" class="block text-sm font-medium text-gray-700">Payer</label>
				<select
					id="payer_id"
					bind:value={payerId}
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
					required
				>
					<option value={null} disabled>Select who paid</option>
					{#each groupWithUsers.users ?? [] as member (member.id)}
						<option value={member.id}>{member.username}</option>
					{/each}
				</select>
			</div>

			<div class="mt-4">
				<label for="split-type" class="mb-2 block text-sm font-medium text-gray-700">Split Type</label>
				<div id="split-type" class="flex overflow-hidden rounded-md border border-gray-200">
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
			</div>

			<div>
				<div class="flex items-center justify-between">
					<label for="participants-list" class="mb-2 block text-sm font-medium text-gray-700">Participants</label>
					{#if splitType !== 'EVEN' && selectedParticipants.size > 0}
						<span class="text-sm text-gray-500">
							Total: {calculateTotal()}
							{#if splitType === 'AMOUNT' && amountStr}
								/ {parseFloat(amountStr).toFixed(2)}€
							{:else if splitType === 'PERCENTAGE'}
								/ 100%
							{/if}
						</span>
					{/if}
				</div>

				<div id="participants-list" class="max-h-48 space-y-2 overflow-y-auto rounded-md border border-gray-200 p-2">
					{#each groupWithUsers.users ?? [] as member (member.id)}
						<div class="flex items-center justify-between border-b border-gray-100 p-2 last:border-b-0">
							<div class="flex items-center">
								<input
									type="checkbox"
									id={`participant-${member.id}`}
									checked={member.id ? selectedParticipants.has(member.id) : false}
									onclick={() => member.id && toggleParticipant(member.id)}
									class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
								/>
								<label for={`participant-${member.id}`} class="ml-2 text-sm text-gray-700">
									{member.username}
								</label>
							</div>
							{#if member.id && selectedParticipants.has(member.id) && splitType !== 'EVEN'}
								<div class="w-24">
									<input
										type="number"
										class="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
										placeholder={splitType === 'PERCENTAGE' ? '% share' : '€ amount'}
										value={participantAmounts.get(member.id) || ''}
										oninput={(e) => participantAmounts.set(member.id!, e.currentTarget.value)}
										step={splitType === 'PERCENTAGE' ? '1' : '0.01'}
										min="0"
										max={splitType === 'PERCENTAGE' ? '100' : undefined}
									/>
								</div>
							{/if}
						</div>
					{/each}
				</div>
				{#if participantsError}
					<p class="mt-1 text-sm text-red-600">{participantsError}</p>
				{/if}

				{#if selectedParticipants.size === 0}
					<p class="mt-1 text-sm text-amber-600">Please select at least one participant</p>
				{/if}
			</div>
		{:else if selectedGroup}
			<div class="py-4 text-center">
				<IconLoader class="mx-auto size-8 animate-spin text-blue-500" />
				<p class="mt-2 text-sm text-gray-500">Loading group members...</p>
			</div>
		{/if}

		{#if formError}
			<div class="rounded-md bg-red-50 p-3 text-sm text-red-700">{formError}</div>
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
				disabled={submitting || loading}
				class="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
			>
				{#if submitting}
					<div class="flex items-center gap-2">
						<IconLoader class="size-4 animate-spin" />
						<span>Adding...</span>
					</div>
				{:else}
					Add Transaction
				{/if}
			</button>
		</div>
	</form>
</dialog>
