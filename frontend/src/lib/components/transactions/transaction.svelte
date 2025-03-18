<script lang="ts">
	import IconEdit from '~icons/tabler/edit';
	import IconTrash from '~icons/tabler/trash';

	let { transaction, showActions = false, onEdit = $bindable(), onDelete = $bindable() } = $props();

	function formatAmount(amount: number): string {
		return (amount / 100).toFixed(2);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('de-DE', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="flex items-start justify-between p-4">
	<div class="flex-1">
		<div class="flex items-center gap-2">
			<p class="font-medium">{transaction.description}</p>
			{#if showActions && onEdit && onDelete}
				<div class="flex items-center gap-1">
					<button
						type="button"
						class="rounded p-1 text-gray-500 hover:bg-gray-100"
						onclick={() => onEdit(transaction)}
					>
						<IconEdit class="size-4" />
					</button>
					<button
						type="button"
						class="rounded p-1 text-gray-500 hover:bg-gray-100"
						onclick={() => onDelete(transaction)}
					>
						<IconTrash class="size-4" />
					</button>
				</div>
			{/if}
		</div>
		<p class="text-sm text-gray-500">
			{transaction.from} → {transaction.to.join(', ')}
		</p>
	</div>
	<div class="text-right">
		<p class="font-medium">€{formatAmount(transaction.amount)}</p>
		<p class="text-sm text-gray-500">{formatDate(transaction.date)}</p>
	</div>
</div>
