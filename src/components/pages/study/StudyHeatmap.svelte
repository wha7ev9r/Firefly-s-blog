<script lang="ts">
let { records = [], levels = [] } = $props();

let dateMap = $derived.by(() => {
	const map = {} as Record<string, number>;
	for (const r of records) {
		map[r.date] = r.minutes;
	}
	return map;
});

let today = $derived(new Date());

let days = $derived.by(() => {
	const result = [];
	for (let i = 363; i >= 0; i--) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		result.push({
			date: d.toISOString().substring(0, 10),
			dayOfWeek: d.getDay(),
			weekIndex: Math.floor(i / 7),
		});
	}
	return result;
});

let weeks = $derived.by(() => {
	const result = [];
	for (let w = 0; w < 52; w++) {
		const weekDays = [];
		for (let d = 0; d < 7; d++) {
			const idx = w * 7 + d;
			if (idx < days.length) {
				weekDays.push(days[idx]);
			}
		}
		if (weekDays.length > 0) result.push(weekDays);
	}
	return result;
});

function getLevel(dateStr: string): number {
	const minutes = dateMap[dateStr] || 0;
	if (minutes === 0) return 0;
	for (let i = levels.length - 1; i >= 0; i--) {
		if (minutes >= levels[i].min) return i;
	}
	return 1;
}

const colorClasses = [
	"bg-neutral-100 dark:bg-neutral-800",
	"bg-green-200 dark:bg-green-900/40",
	"bg-green-400 dark:bg-green-700/60",
	"bg-green-500 dark:bg-green-600/80",
	"bg-green-600 dark:bg-green-500",
];

const weekDayLabels = ["", "一", "", "三", "", "五", ""];

let monthLabels = $derived.by(() => {
	const labels = [];
	let lastMonth = -1;
	for (const day of days) {
		const month = new Date(day.date).getMonth();
		if (month !== lastMonth) {
			labels.push({ weekIndex: day.weekIndex, month });
			lastMonth = month;
		}
	}
	return labels;
});

const monthNames = [
	"1月",
	"2月",
	"3月",
	"4月",
	"5月",
	"6月",
	"7月",
	"8月",
	"9月",
	"10月",
	"11月",
	"12月",
];
</script>

<div class="overflow-x-auto">
	<div class="flex gap-1 min-w-fit">
		<div class="flex flex-col gap-[3px] mr-1 text-xs text-(--content-meta) pt-5">
			{#each weekDayLabels as label}
				<div class="h-[10px] leading-[10px]">{label}</div>
			{/each}
		</div>
		<div>
			<div class="flex gap-[3px] mb-[2px] text-xs text-(--content-meta)">
				{#each { length: weeks.length } as _, i}
					{@const m = monthLabels.find((l) => l.weekIndex === i)}
					<div class="w-[10px] text-center" class:invisible={!m}>
						{m ? monthNames[m.month] : ""}
					</div>
				{/each}
			</div>
			<div class="flex gap-[3px]">
				{#each weeks as week}
					<div class="flex flex-col gap-[3px]">
						{#each week as day}
							<div
								class="w-[10px] h-[10px] rounded-sm {colorClasses[getLevel(day.date)]}"
								title="{day.date}: {dateMap[day.date] || 0} 分钟"
							></div>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	</div>
	<div class="flex items-center gap-1 mt-3 justify-end text-xs text-(--content-meta)">
		<span>少</span>
		{#each colorClasses as cls}
			<div class="w-3 h-3 rounded-sm {cls}"></div>
		{/each}
		<span>多</span>
	</div>
</div>
