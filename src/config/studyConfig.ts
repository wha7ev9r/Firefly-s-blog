import type { StudyData } from "../types/study";
import studyRaw from "../data/study-data.json";

export const studyConfig = {
	dailyGoal: 30,
	upName: "学过石油的语文老师",
	upUrl: "https://space.bilibili.com/39737405",
	heatmapLevels: [
		{ min: 0, max: 0 },
		{ min: 1, max: 15 },
		{ min: 16, max: 30 },
		{ min: 31, max: 60 },
		{ min: 61, max: Infinity },
	],
};

export const studyData: StudyData = studyRaw as StudyData;
