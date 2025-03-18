<script lang="ts">
	import IconChevronLeft from '~icons/tabler/chevron-left';
	import IconChevronRight from '~icons/tabler/chevron-right';

	let { currentPage, totalPages, itemsPerPage, onPageChange, onItemsPerPageChange } = $props();

	const pageOptions = [10, 25, 50, 100];

	function getPageNumbers() {
		const pages: (number | 'ellipsis')[] = [];
		const maxVisiblePages = 5;
		const halfMaxPages = Math.floor(maxVisiblePages / 2);

		if (totalPages <= maxVisiblePages) {
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}

		pages.push(1);

		if (currentPage > halfMaxPages + 1) {
			pages.push('ellipsis');
		}

		const startPage = Math.max(2, currentPage - halfMaxPages);
		const endPage = Math.min(totalPages - 1, currentPage + halfMaxPages);

		for (let i = startPage; i <= endPage; i++) {
			pages.push(i);
		}

		if (currentPage < totalPages - halfMaxPages) {
			pages.push('ellipsis');
		}

		pages.push(totalPages);

		return pages;
	}
</script>

<div class="flex items-center justify-between">
	<div class="flex items-center gap-2">
		<button
			type="button"
			class="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
			disabled={currentPage === 1}
			onclick={() => onPageChange(currentPage - 1)}
		>
			<IconChevronLeft class="size-4" />
		</button>

		<nav class="flex items-center gap-1">
			{#each getPageNumbers() as page (page)}
				{#if page === 'ellipsis'}
					<span class="px-2">...</span>
				{:else}
					<button
						type="button"
						class="rounded-lg border border-gray-200 px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50 {page ===
						currentPage
							? 'border-blue-600 bg-blue-50 text-blue-600'
							: ''}"
						disabled={page === currentPage}
						onclick={() => onPageChange(page)}
					>
						{page}
					</button>
				{/if}
			{/each}
		</nav>

		<button
			type="button"
			class="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
			disabled={currentPage === totalPages}
			onclick={() => onPageChange(currentPage + 1)}
		>
			<IconChevronRight class="size-4" />
		</button>
	</div>

	<div class="flex items-center gap-2">
		<label for="items-per-page" class="text-sm text-gray-700">Items per page:</label>
		<select
			id="items-per-page"
			bind:value={itemsPerPage}
			class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
			onchange={(e) => onItemsPerPageChange(Number(e.currentTarget.value))}
		>
			{#each pageOptions as option (option)}
				<option value={option}>{option}</option>
			{/each}
		</select>
	</div>
</div>
