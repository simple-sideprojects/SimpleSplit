<script lang="ts">
	import type {
		TransactionCreate,
		TransactionParticipantCreate,
		TransactionType
	} from '$lib/client/types.gen';
	import { zTransactionCreate } from '$lib/client/zod.gen';
	import { toast } from 'svelte-sonner';
	import { zod } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';
	import IconLoader from '~icons/tabler/loader';
	import IconX from '~icons/tabler/x';

	let { groups, openDialog = $bindable(), user } = $props();

	let dialog: HTMLDialogElement;
	let loading = $state(false);
	let selectedGroup = $state<string | null>(null);
	let groupWithUsers = $state<any | null>(null);
	let splitType = $state<TransactionType>('EVEN');
	let selectedParticipants = $state<Set<string>>(new Set());
	let participantAmounts = $state<Map<string, string>>(new Map());
	let purchasedDate = $state(new Date().toISOString().split('T')[0]);
	let participantsError = $state<string | null>(null);

	const {
		form: transactionForm,
		errors,
		enhance,
		submitting,
		reset
	} = superForm(
		{},
		{
			validators: zod(zTransactionCreate),
			resetForm: true,
			dataType: 'json',
			onResult: ({ result }) => {
				if (result.type === 'success') {
					toast.success('Transaction added successfully');
					closeDialog();
				} else if (result.type === 'error') {
					toast.error('Failed to add transaction');
				}
			},
			onSubmit: ({ jsonData, cancel }) => {
				// Data validation check
				if (!selectedGroup || !$transactionForm.payer_id || selectedParticipants.size === 0) {
					toast.error('Please fill in all required fields');
					return cancel();
				}

				// Convert amount from euros to cents
				const amountInCents = Math.round(parseFloat($transactionForm.amount || '0') * 100);

				// Validate participants based on split type
				participantsError = null;
				const participants: TransactionParticipantCreate[] = [];

				if (selectedParticipants.size > 0) {
					if (splitType === 'EVEN') {
						const amountPerPerson = Math.round(amountInCents / selectedParticipants.size);
						for (const userId of selectedParticipants) {
							participants.push({
								debtor_id: userId,
								amount_owed: amountPerPerson
							});
						}
					} else if (splitType === 'AMOUNT') {
						let totalAmount = 0;
						// First pass to calculate total amount
						for (const userId of selectedParticipants) {
							const userAmount = parseFloat(participantAmounts.get(userId) || '0');
							if (isNaN(userAmount)) {
								participantsError = `Please enter a valid amount for all participants`;
								return cancel();
							}
							totalAmount += Math.round(userAmount * 100);
						}

						if (totalAmount !== amountInCents) {
							participantsError = `Total amounts (${(totalAmount / 100).toFixed(2)}€) don't match transaction amount (${(amountInCents / 100).toFixed(2)}€)`;
							return cancel();
						}

						// Second pass to create participants
						for (const userId of selectedParticipants) {
							const userAmount = parseFloat(participantAmounts.get(userId) || '0');
							participants.push({
								debtor_id: userId,
								amount_owed: Math.round(userAmount * 100)
							});
						}
					} else if (splitType === 'PERCENTAGE') {
						let totalPercentage = 0;
						// First pass to validate percentages
						for (const userId of selectedParticipants) {
							const percentage = parseFloat(participantAmounts.get(userId) || '0');
							if (isNaN(percentage)) {
								participantsError = `Please enter a valid percentage for all participants`;
								return cancel();
							}
							totalPercentage += percentage;
						}

						if (Math.abs(totalPercentage - 100) > 0.01) {
							participantsError = `Total percentage (${totalPercentage.toFixed(2)}%) doesn't add up to 100%`;
							return cancel();
						}

						// Second pass to create participants
						for (const userId of selectedParticipants) {
							const percentage = parseFloat(participantAmounts.get(userId) || '0');
							const calculatedAmount = Math.round((percentage / 100) * amountInCents);
							participants.push({
								debtor_id: userId,
								amount_owed: calculatedAmount
							});
						}
					}
				}

				const formData: TransactionCreate = {
					group_id: selectedGroup,
					payer_id: $transactionForm.payer_id,
					title: $transactionForm.title,
					amount: amountInCents,
					purchased_on: purchasedDate ? new Date(purchasedDate).toISOString() : undefined,
					transaction_type: splitType,
					participants: participants
				};

				jsonData(formData);
			}
		}
	);

	$effect(() => {
		if (selectedGroup) {
			loadGroupUsers();
		}
	});

	// Separate $effect for splitType changes to prevent infinite loops
	$effect(() => {
		const currentSplitType = splitType;

		// Only reset participant amounts when split type changes, but don't create a new Map object
		if (currentSplitType === 'EVEN') {
			for (const userId of participantAmounts.keys()) {
				participantAmounts.delete(userId);
			}
		} else {
			// Initialize amounts for all selected participants if they don't have amounts yet
			for (const userId of selectedParticipants) {
				if (!participantAmounts.has(userId)) {
					participantAmounts.set(userId, '');
				}
			}
		}
		participantsError = null;
	});

	async function loadGroupUsers() {
		loading = true;
		try {
			const response = await fetch(`/api/groups/${selectedGroup}`);
			if (!response.ok) {
				throw new Error('Failed to fetch group');
			}
			const data = await response.json();
			groupWithUsers = data;
			// Reset participants when group changes
			selectedParticipants = new Set();

			// Clear the participantAmounts map instead of creating a new one
			for (const userId of participantAmounts.keys()) {
				participantAmounts.delete(userId);
			}

			$transactionForm.payer_id = user.id;
			for (const user of groupWithUsers.users) {
				selectedParticipants.add(user.id);
			}

			participantsError = null;
		} catch (error) {
			toast.error('Failed to load group users');
		} finally {
			loading = false;
		}
	}

	openDialog = () => {
		dialog.showModal();
	};

	const closeDialog = () => {
		dialog.close();
		resetForm();
	};

	const handleClickOutside = (event: MouseEvent) => {
		const rect = dialog.getBoundingClientRect();
		const isInDialog =
			rect.top <= event.clientY &&
			event.clientY <= rect.top + rect.height &&
			rect.left <= event.clientX &&
			event.clientX <= rect.left + rect.width;
		if (!isInDialog) {
			dialog.close();
		}
	};

	function resetForm() {
		reset();
		selectedGroup = null;
		groupWithUsers = null;
		splitType = 'EVEN';
		selectedParticipants = new Set();

		// Clear the map instead of creating a new one
		for (const userId of participantAmounts.keys()) {
			participantAmounts.delete(userId);
		}

		participantsError = null;
		purchasedDate = new Date().toISOString().split('T')[0];
	}

	function toggleParticipant(userId: string) {
		if (selectedParticipants.has(userId)) {
			selectedParticipants.delete(userId);
			participantAmounts.delete(userId);
		} else {
			selectedParticipants.add(userId);
			if (splitType !== 'EVEN') {
				participantAmounts.set(userId, '');
			}
		}
		participantsError = null;
	}

	function calculateTotal() {
		if (splitType === 'AMOUNT') {
			let total = 0;
			for (const userId of selectedParticipants) {
				const amount = parseFloat(participantAmounts.get(userId) || '0');
				if (!isNaN(amount)) {
					total += amount;
				}
			}
			return total.toFixed(2) + '€';
		} else if (splitType === 'PERCENTAGE') {
			let total = 0;
			for (const userId of selectedParticipants) {
				const percentage = parseFloat(participantAmounts.get(userId) || '0');
				if (!isNaN(percentage)) {
					total += percentage;
				}
			}
			return total.toFixed(2) + '%';
		}
		return null;
	}
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

	<form action="/?/createTransaction" method="POST" class="mt-6 space-y-4" use:enhance>
		<div>
			<label for="title" class="block text-sm font-medium text-gray-700">Title</label>
			<input
				type="text"
				id="title"
				name="title"
				bind:value={$transactionForm.title}
				required
				class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				placeholder="Enter transaction title"
			/>
			{#if $errors.title}
				<p class="mt-1 text-sm text-red-600">{$errors.title}</p>
			{/if}
		</div>

		<div>
			<label for="amount" class="block text-sm font-medium text-gray-700">Amount (€)</label>
			<input
				type="number"
				id="amount"
				name="amount"
				bind:value={$transactionForm.amount}
				step="0.01"
				min="0"
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				required
			/>
			{#if $errors.amount}
				<p class="mt-1 text-sm text-red-600">{$errors.amount}</p>
			{/if}
		</div>

		<div>
			<label for="purchased_on" class="block text-sm font-medium text-gray-700">Purchased On</label>
			<div class="relative mt-1">
				<input
					type="date"
					id="purchased_on"
					name="purchased_on"
					bind:value={purchasedDate}
					class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				/>
			</div>
		</div>

		<div>
			<label for="group_id" class="block text-sm font-medium text-gray-700">Group</label>
			<select
				id="group_id"
				name="group_id"
				bind:value={selectedGroup}
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				required
			>
				<option value="" disabled selected>Select a group</option>
				{#each groups || [] as group}
					<option value={group.id}>{group.name}</option>
				{/each}
			</select>
			{#if $errors.group_id}
				<p class="mt-1 text-sm text-red-600">{$errors.group_id}</p>
			{/if}
		</div>

		{#if groupWithUsers}
			<div>
				<label for="payer_id" class="block text-sm font-medium text-gray-700">Payer</label>
				<select
					id="payer_id"
					name="payer_id"
					bind:value={$transactionForm.payer_id}
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
					required
				>
					<option value="" disabled selected>Select who paid</option>
					{#each groupWithUsers.users || [] as user}
						<option value={user.id}>{user.username}</option>
					{/each}
				</select>
				{#if $errors.payer_id}
					<p class="mt-1 text-sm text-red-600">{$errors.payer_id}</p>
				{/if}
			</div>

			<!-- Split Type Tabs -->
			<div class="mt-4">
				<label class="mb-2 block text-sm font-medium text-gray-700">Split Type</label>
				<div class="flex overflow-hidden rounded-md border border-gray-200">
					<button
						type="button"
						class={`flex-1 px-3 py-2 text-sm font-medium ${
							splitType === 'EVEN'
								? 'bg-blue-100 text-blue-700'
								: 'bg-white text-gray-500 hover:bg-gray-50'
						}`}
						onclick={() => (splitType = 'EVEN')}
					>
						Even
					</button>
					<button
						type="button"
						class={`flex-1 px-3 py-2 text-sm font-medium ${
							splitType === 'AMOUNT'
								? 'bg-blue-100 text-blue-700'
								: 'bg-white text-gray-500 hover:bg-gray-50'
						}`}
						onclick={() => (splitType = 'AMOUNT')}
					>
						Amount
					</button>
					<button
						type="button"
						class={`flex-1 px-3 py-2 text-sm font-medium ${
							splitType === 'PERCENTAGE'
								? 'bg-blue-100 text-blue-700'
								: 'bg-white text-gray-500 hover:bg-gray-50'
						}`}
						onclick={() => (splitType = 'PERCENTAGE')}
					>
						Percentage
					</button>
				</div>
			</div>

			<!-- Participants -->
			<div>
				<div class="flex items-center justify-between">
					<label class="mb-2 block text-sm font-medium text-gray-700">Participants</label>
					{#if splitType !== 'EVEN' && selectedParticipants.size > 0}
						<span class="text-sm text-gray-500">
							Total: {calculateTotal()}
							{#if splitType === 'AMOUNT' && $transactionForm.amount}
								/ {parseFloat($transactionForm.amount).toFixed(2)}€
							{:else if splitType === 'PERCENTAGE'}
								/ 100%
							{/if}
						</span>
					{/if}
				</div>

				<div class="max-h-48 space-y-2 overflow-y-auto rounded-md border border-gray-200 p-2">
					{#each groupWithUsers.users || [] as user}
						<div
							class="flex items-center justify-between border-b border-gray-100 p-2 last:border-b-0"
						>
							<div class="flex items-center">
								<input
									type="checkbox"
									id={`participant-${user.id}`}
									checked={selectedParticipants.has(user.id)}
									onclick={() => toggleParticipant(user.id)}
									class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
								/>
								<label for={`participant-${user.id}`} class="ml-2 text-sm text-gray-700">
									{user.username}
								</label>
							</div>
							{#if selectedParticipants.has(user.id) && splitType !== 'EVEN'}
								<div class="w-24">
									<input
										type="number"
										class="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
										placeholder={splitType === 'PERCENTAGE' ? '% share' : '€ amount'}
										value={participantAmounts.get(user.id) || ''}
										oninput={(e) => participantAmounts.set(user.id, e.currentTarget.value)}
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
				{:else if $errors.participants}
					<p class="mt-1 text-sm text-red-600">{$errors.participants}</p>
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
				disabled={$submitting || loading}
				class="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
			>
				{#if $submitting}
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
