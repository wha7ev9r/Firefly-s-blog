// 注意：此文件会被 astro.config.mjs 经 src/config/index.ts 间接加载，
// 该加载环境不解析 tsconfig 路径别名，CSV 导入必须使用相对路径

import type { FriendLink, FriendsPageConfig } from "@/types/config";
import friendsCsv from "../data/friends.csv?raw";

// 可以在src/content/spec/friends.md中编写友链页面下方的自定义内容

// 友链页面配置
export const friendsPageConfig: FriendsPageConfig = {
	// 页面标题，如果留空则使用 i18n 中的翻译
	title: "",

	// 页面描述文本，如果留空则使用 i18n 中的翻译
	description: "",

	// 是否显示底部自定义内容（friends.mdx 中的内容）
	showCustomContent: true,

	// 是否显示评论区，需要先在commentConfig.ts启用评论系统
	showComment: true,

	// 是否开启随机排序配置，如果开启，就会忽略权重，构建时进行一次随机排序
	randomizeSort: false,
};

// 解析 CSV 文本（支持双引号包裹、引号转义与字段内换行）
const parseCsv = (text: string): string[][] => {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = "";
	let inQuotes = false;

	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (inQuotes) {
			if (char === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				field += char;
			}
		} else if (char === '"') {
			inQuotes = true;
		} else if (char === ",") {
			row.push(field);
			field = "";
		} else if (char === "\n" || char === "\r") {
			if (char === "\r" && text[i + 1] === "\n") {
				i++;
			}
			row.push(field);
			field = "";
			rows.push(row);
			row = [];
		} else {
			field += char;
		}
	}

	if (field !== "" || row.length > 0) {
		row.push(field);
		rows.push(row);
	}

	return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
};

// 友链数据来自 src/data/friends.csv，可通过 Pages CMS 的 CSV 代码编辑器在线维护
const csvRows = parseCsv(friendsCsv);
const header = csvRows[0] ?? [];
const columnIndex = (name: string): number => header.indexOf(name);

const requiredColumns = [
	"title",
	"imgurl",
	"desc",
	"siteurl",
	"tags",
	"weight",
	"enabled",
];
const missingColumns = requiredColumns.filter(
	(name) => columnIndex(name) === -1,
);

if (missingColumns.length > 0) {
	throw new Error(`friends.csv 缺少必需的表头列: ${missingColumns.join(", ")}`);
}

export const friendsConfig: FriendLink[] = csvRows.slice(1).map((cells) => {
	const cell = (name: string): string => cells[columnIndex(name)]?.trim() ?? "";

	return {
		title: cell("title"),
		imgurl: cell("imgurl"),
		desc: cell("desc"),
		siteurl: cell("siteurl"),
		tags: cell("tags")
			.split(";")
			.map((tag) => tag.trim())
			.filter(Boolean),
		weight: Number(cell("weight")) || 0,
		enabled: cell("enabled").toLowerCase() === "true",
	};
});

// 获取启用的友链并进行排序
export const getEnabledFriends = (): FriendLink[] => {
	const friends = friendsConfig.filter((friend) => friend.enabled);

	if (friendsPageConfig.randomizeSort) {
		return friends.sort(() => Math.random() - 0.5);
	}

	return friends.sort((a, b) => b.weight - a.weight);
};
