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

// 以周一为一周开始，生成真实日历周
let weeks = $derived.by(() => {
	const startDate = new Date(today);
	startDate.setDate(startDate.getDate() - 363);

	// 对齐到最近的周一（getDay: 0=周日, 1=周一）
	const diffToMonday = startDate.getDay() === 0 ? -6 : 1 - startDate.getDay();
	if (diffToMonday !== 0) startDate.setDate(startDate.getDate() + diffToMonday);

	// 从周一生成到 today，按周分组（周日作为一周结尾）
	const allDays = [];
	const cur = new Date(startDate);
	while (cur <= today) {
		allDays.push({
			date: cur.toISOString().substring(0, 10),
			dayOfWeek: cur.getDay(),
		});
		cur.setDate(cur.getDate() + 1);
	}

	const result = [];
	let week: typeof allDays = [];
	for (const day of allDays) {
		week.push(day);
		if (day.dayOfWeek === 0) {
			result.push(week);
			week = [];
		}
	}
	if (week.length > 0) result.push(week);
	return result;
});

// 每月第一周显示月份标签
let monthLabels = $derived.by(() => {
	const labels = [];
	let lastMonth = -1;
	for (let w = 0; w < weeks.length; w++) {
		const firstDay = weeks[w][0];
		if (!firstDay) continue;
		const month = new Date(firstDay.date).getMonth();
		if (month !== lastMonth) {
			labels.push({ weekIndex: w, month });
			lastMonth = month;
		}
	}
	return labels;
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

const weekRowLabels = ["一", "二", "三", "四", "五", "六", "日"];
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
			{#each weekRowLabels as label}
				<div class="h-[10px] leading-[10px]">{label}</div>
			{/each}
		</div>
		<div>
			<div class="flex gap-[3px] mb-[2px] text-xs text-(--content-meta)" style="padding-inline-start: 0">
				{#each weeks as _, wi}
					{@const m = monthLabels.find((l) => l.weekIndex === wi)}
					<div class="w-[10px] text-center" class:invisible={!m}>
						{m ? monthNames[m.month] : ""}
					</div>
				{/each}
			</div>
			<div class="flex gap-[3px]">
				{#each weeks as week}
					<div class="flex flex-col gap-[3px]">
						{#each [0, 1, 2, 3, 4, 5, 6] as rowIdx}
							{@const day = week[rowIdx]}
							{#if day}
								<div
									class="w-[10px] h-[10px] rounded-sm {colorClasses[getLevel(day.date)]}"
									title="{day.date}: {dateMap[day.date] || 0} 分钟"
								></div>
							{:else}
								<div class="w-[10px] h-[10px]"></div>
							{/if}
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
