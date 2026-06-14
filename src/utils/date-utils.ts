import { siteConfig } from "../config";

// 缓存配置时区是否合法的判断结果，避免每次格式化都做一次 try
let cachedTimezone: string | undefined;
let timezoneChecked = false;

function getSafeTimezone(): string | undefined {
	if (timezoneChecked) return cachedTimezone;
	timezoneChecked = true;
	const tz = siteConfig.timezone;
	if (!tz) {
		cachedTimezone = undefined;
		return undefined;
	}
	try {
		new Intl.DateTimeFormat("en-CA", { timeZone: tz });
		cachedTimezone = tz;
	} catch {
		console.warn(
			`[date-utils] siteConfig.timezone "${tz}" 不是合法的 IANA 时区，回退到运行时默认时区`,
		);
		cachedTimezone = undefined;
	}
	return cachedTimezone;
}

export function formatDateToYYYYMMDD(date: Date): string {
	const options: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	};

	const tz = getSafeTimezone();
	if (tz) {
		options.timeZone = tz;
	}

	const parts = new Intl.DateTimeFormat("en-CA", options).formatToParts(date);
	const get = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((p) => p.type === type)?.value || "";

	return `${get("year")}-${get("month")}-${get("day")}`;
}

// 国际化日期格式化函数
export function formatDateI18n(
	dateInput: Date | string,
	includeTime?: boolean,
): string {
	const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
	const lang = (siteConfig.lang || "en").toLowerCase();

	// 根据语言设置不同的日期格式
	const options: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "long",
		day: "numeric",
	};

	if (includeTime) {
		options.hour = "2-digit";
		options.minute = "2-digit";
		options.second = "2-digit";
	}

	const tz = getSafeTimezone();
	if (tz) {
		options.timeZone = tz;
	}

	// 语言代码映射（小写键，与 translation.ts 保持一致）
	const localeMap: Record<string, string> = {
		zh_cn: "zh-CN",
		zh_tw: "zh-TW",
		en: "en-US",
		en_us: "en-US",
		en_gb: "en-GB",
		en_au: "en-AU",
		ja: "ja-JP",
		ja_jp: "ja-JP",
		ko: "ko-KR",
		es: "es-ES",
		th: "th-TH",
		vi: "vi-VN",
		tr: "tr-TR",
		id: "id-ID",
		fr: "fr-FR",
		de: "de-DE",
		ru: "ru-RU",
		ru_ru: "ru-RU",
		ar: "ar-SA",
	};

	const locale = localeMap[lang] || "en-US";
	return includeTime
		? date.toLocaleString(locale, options)
		: date.toLocaleDateString(locale, options);
}

// 国际化日期时间格式化函数（带时分秒）
export function formatDateI18nWithTime(dateInput: Date | string): string {
	return formatDateI18n(dateInput, true);
}

// 统一格式为 YYYY-MM-DD HH:mm，支持站点时区
export function formatDateTimeToYYYYMMDDHHmm(dateInput: Date | string): string {
	const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

	const options: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	};

	const tz = getSafeTimezone();
	if (tz) {
		options.timeZone = tz;
	}

	const parts = new Intl.DateTimeFormat("en-CA", options).formatToParts(date);
	const get = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((p) => p.type === type)?.value || "";

	return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}
