<script lang="ts">
let { courses = [], upName = "", upUrl = "" } = $props();

let grouped = $derived.by(() => {
	const groups = {} as Record<string, typeof courses>;
	for (const c of courses) {
		if (!groups[c.category]) groups[c.category] = [];
		groups[c.category].push(c);
	}
	return groups;
});

let expandedCategories = $state(new Set(Object.keys(grouped)));

function toggleCategory(cat: string) {
	const next = new Set(expandedCategories);
	if (next.has(cat)) {
		next.delete(cat);
	} else {
		next.add(cat);
	}
	expandedCategories = next;
}

function progressColor(progress: number) {
	if (progress >= 100) return "bg-green-500";
	if (progress >= 50) return "bg-(--primary)";
	return "bg-amber-500";
}

function statusClass(status: string) {
	if (status === "completed") return "text-green-500";
	if (status === "studying") return "text-(--primary)";
	return "text-(--content-meta)";
}

function statusText(status: string) {
	if (status === "completed") return "已完成";
	if (status === "studying") return "学习中";
	return "未开始";
}
</script>

<div class="space-y-4">
	{#each Object.entries(grouped) as [category, catCourses]}
		<div class="category-group rounded-xl border border-(--line-divider) overflow-hidden">
			<button
				class="category-header w-full flex items-center justify-between px-4 py-3 bg-(--btn-regular-bg) hover:bg-(--btn-regular-bg-hover) transition-colors"
				onclick={() => toggleCategory(category)}
			>
				<span class="font-semibold text-neutral-900 dark:text-neutral-100">
					{category}
					<span class="text-sm text-(--content-meta) ml-2">({catCourses.length})</span>
				</span>
				<span class="text-(--content-meta) transition-transform {expandedCategories.has(category) ? 'rotate-180' : ''}">
					&#9660;
				</span>
			</button>
			{#if expandedCategories.has(category)}
				<div class="px-4 py-2 space-y-3">
					{#each catCourses as course}
						{@const progress = Math.round((course.completedLessons / course.totalLessons) * 100)}
						<a
							href={course.url}
							target="_blank"
							rel="noopener noreferrer"
							class="course-item block p-3 rounded-lg hover:bg-(--btn-plain-bg-hover) transition-colors"
						>
							<div class="flex items-start justify-between mb-2">
								<div class="flex-1 min-w-0">
									<div class="font-medium text-neutral-900 dark:text-neutral-100 truncate pr-2 text-sm">
										{course.title}
									</div>
									<div class="text-xs text-(--content-meta) mt-0.5">
										{course.completedLessons}/{course.totalLessons} 课时
									</div>
								</div>
								<span class="text-xs font-medium px-2 py-0.5 rounded shrink-0 {statusClass(course.status)}">
									{statusText(course.status)}
								</span>
							</div>
							<div class="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
								<div
									class="h-full rounded-full transition-all duration-500 {progressColor(progress)}"
									style="width: {progress}%"
								></div>
							</div>
							<div class="text-xs text-(--content-meta) mt-1 text-right">{progress}%</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	{/each}

	{#if upName}
		<div class="text-center text-sm text-(--content-meta) pt-2">
			课程提供者：
			<a
				href={upUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="text-(--primary) hover:underline"
			>
				{upName}
			</a>
		</div>
	{/if}
</div>
