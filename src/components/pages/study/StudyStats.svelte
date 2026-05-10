<script lang="ts">
let { records = [], dailyGoal = 30 } = $props();

let totalDays = $derived(records.length);
let totalMinutes = $derived(
	records.reduce((sum: number, r: { minutes: number }) => sum + r.minutes, 0),
);
let totalHours = $derived((totalMinutes / 60).toFixed(1));

function computeStreaks(recs: { date: string }[]) {
	if (recs.length === 0) return { current: 0, longest: 0 };
	const sorted = recs.map((r) => r.date).sort();
	let longest = 1;
	let current = 1;
	for (let i = 1; i < sorted.length; i++) {
		const prev = new Date(sorted[i - 1]);
		const curr = new Date(sorted[i]);
		const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
		if (diff === 1) {
			current++;
			longest = Math.max(longest, current);
		} else {
			current = 1;
		}
	}
	const today = new Date().toISOString().substring(0, 10);
	const lastDate = sorted[sorted.length - 1];
	const daysSinceLast = Math.round(
		(new Date(today).getTime() - new Date(lastDate).getTime()) /
			(1000 * 60 * 60 * 24),
	);
	return { current: daysSinceLast <= 1 ? current : 0, longest };
}

let streaks = $derived(computeStreaks(records));
let averageDaily = $derived(
	totalDays > 0 ? Math.round(totalMinutes / totalDays) : 0,
);
</script>

<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
	<div class="stat-card bg-(--btn-regular-bg) rounded-xl p-4 text-center">
		<div class="text-2xl font-bold text-(--primary)">{totalDays}</div>
		<div class="text-sm text-(--content-meta) mt-1">学习天数</div>
	</div>
	<div class="stat-card bg-(--btn-regular-bg) rounded-xl p-4 text-center">
		<div class="text-2xl font-bold text-(--primary)">{totalHours}</div>
		<div class="text-sm text-(--content-meta) mt-1">总学习时长</div>
	</div>
	<div class="stat-card bg-(--btn-regular-bg) rounded-xl p-4 text-center">
		<div class="text-2xl font-bold text-(--primary)">{streaks.current}</div>
		<div class="text-sm text-(--content-meta) mt-1">当前连续天数</div>
	</div>
	<div class="stat-card bg-(--btn-regular-bg) rounded-xl p-4 text-center">
		<div class="text-2xl font-bold text-(--primary)">{streaks.longest}</div>
		<div class="text-sm text-(--content-meta) mt-1">最长连续天数</div>
	</div>
</div>
