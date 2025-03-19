<script lang="ts">
	import { env } from '$env/dynamic/public';
	import IconX from '~icons/tabler/x';

	let { openDialog = $bindable(), transaction } = $props();

	let dialog: HTMLDialogElement;
	let description = $state('');
	let amount = $state('');
	let from = $state('');
	let to = $state<string[]>([]);
	let error = $state<string | null>(null);

	openDialog = () => {
		description = transaction.description;
		amount = (transaction.amount / 100).toString(); // Convert cents to euros
		from = transaction.from;
		to = transaction.to;
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
		description = '';
		amount = '';
		from = '';
		to = [];
		error = null;
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();

		error = null;

		if (!description || !amount || !from || to.length === 0) {
			error = 'Please fill in all fields';
			return;
		}

		try {
			const response = await fetch(`${env.PUBLIC_BACKEND_URL}/api/transactions/${transaction.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					description,
					amount: Math.round(parseFloat(amount) * 100),
					from,
					to
				})
			});

			if (!response.ok) {
				throw new Error('Failed to update transaction');
			}

			closeDialog();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update transaction';
		}
	}
</script>

<dialog
	bind:this={dialog}
	class="min-w-[400px] place-self-center rounded-lg border border-gray-100 bg-white p-6 shadow-lg backdrop:bg-black/25"
	onclick={handleClickOutside}
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
			<label for="description" class="block text-sm font-medium text-gray-700">Title</label>
			<input
				type="text"
				id="description"
				name="description"
				required
				class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				placeholder="Enter transaction description"
				bind:value={description}
			/>
		</div>

		<div>
			<label for="amount" class="block text-sm font-medium text-gray-700">Amount (€)</label>
			<input
				type="number"
				id="amount"
				bind:value={amount}
				step="0.01"
				min="0"
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				required
			/>
		</div>

		<div>
			<label for="from" class="block text-sm font-medium text-gray-700">From</label>
			<input
				type="text"
				id="from"
				bind:value={from}
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				required
			/>
		</div>

		<div>
			<label for="to" class="block text-sm font-medium text-gray-700">To (comma-separated)</label>
			<input
				type="text"
				id="to"
				bind:value={to}
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				required
			/>
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
				class="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
			>
				Save Changes
			</button>
		</div>
	</form>
</dialog>
