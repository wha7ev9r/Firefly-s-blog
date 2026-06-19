export type QuoteItem = {
	text: string;
	source: string;
	type: "hitokoto" | "poetry";
};

export type BuildTimeQuote = {
	hitokoto: QuoteItem | null;
	poetry: QuoteItem | null;
};

async function fetchHitokoto(): Promise<QuoteItem | null> {
	try {
		const res = await fetch("https://v1.hitokoto.cn/", {
			signal: AbortSignal.timeout(5000),
		});
		if (!res.ok) return null;
		const data = await res.json();
		const source = [data.from, data.from_who].filter(Boolean).join(" - ");
		return { text: data.hitokoto, source: source || "一言", type: "hitokoto" };
	} catch {
		return null;
	}
}

async function fetchJinrishici(): Promise<QuoteItem | null> {
	try {
		const res = await fetch("https://v2.jinrishici.com/one.json", {
			signal: AbortSignal.timeout(5000),
		});
		if (!res.ok) return null;
		const data = await res.json();
		if (data.status !== "success") return null;
		const {
			content,
			origin: { title, author, dynasty },
		} = data.data;
		const source = [author, dynasty].filter(Boolean).join(" · ");
		return {
			text: content,
			source: source ? `${title} —— ${source}` : title,
			type: "poetry",
		};
	} catch {
		return null;
	}
}

export async function fetchBuildTimeQuote(): Promise<BuildTimeQuote> {
	const [hitokoto, poetry] = await Promise.all([
		fetchHitokoto(),
		fetchJinrishici(),
	]);
	return { hitokoto, poetry };
}
