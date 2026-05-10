export type StudyCourseStatus = "studying" | "completed" | "pending";

export interface StudyCourse {
	id: string;
	title: string;
	category: string;
	url: string;
	totalLessons: number;
	completedLessons: number;
	status: StudyCourseStatus;
}

export interface StudyRecord {
	date: string;
	minutes: number;
	note?: string;
}

export interface StudyData {
	courses: StudyCourse[];
	records: StudyRecord[];
}
