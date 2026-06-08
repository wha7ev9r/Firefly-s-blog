<script lang="ts">
let { records = [] } = $props();

let sorted = $derived(
	[...records].sort((a: { date: string }, b: { date: string }) =>
		b.date.localeCompare(a.date),
	),
);
</script>

<div class="relative pl-8 before:content-[''] before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-(--line-divider)">
	{#each sorted as record}
		<div class="relative pb-6 last:pb-0">
			<div class="absolute -left-8 top-1 w-[15px] h-[15px] rounded-full border-2 border-(--primary) bg-(--card-bg) translate-x-[-50%]"></div>
			<div class="flex items-baseline gap-3">
				<span class="text-sm text-(--content-meta) shrink-0">{record.date}</span>
				<span class="text-xs font-medium px-2 py-0.5 rounded bg-(--primary)/10 text-(--primary) shrink-0">{record.minutes} 分钟</span>
			</div>
			{#if record.note}
				<div class="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{record.note}</div>
			{/if}
		</div>
	{/each}

	{#if sorted.length === 0}
		<div class="text-sm text-(--content-meta) py-4 text-center">暂无学习记录</div>
	{/if}
</div>
