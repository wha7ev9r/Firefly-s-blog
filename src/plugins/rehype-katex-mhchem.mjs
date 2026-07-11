import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";
import { toText } from "hast-util-to-text";
import katex from "katex";
import "katex/dist/contrib/mhchem.mjs";
import { SKIP, visitParents } from "unist-util-visit-parents";

const emptyOptions = {};
const emptyClasses = [];

export default function rehypeKatexMhchem(options) {
	const settings = options || emptyOptions;

	return function transform(tree, file) {
		visitParents(tree, "element", (element, parents) => {
			const classes = Array.isArray(element.properties.className)
				? element.properties.className
				: emptyClasses;
			const languageMath = classes.includes("language-math");
			const mathDisplay = classes.includes("math-display");
			const mathInline = classes.includes("math-inline");
			let displayMode = mathDisplay;

			if (!languageMath && !mathDisplay && !mathInline) {
				return;
			}

			let parent = parents[parents.length - 1];
			let scope = element;

			if (
				element.tagName === "code" &&
				languageMath &&
				parent &&
				parent.type === "element" &&
				parent.tagName === "pre"
			) {
				scope = parent;
				parent = parents[parents.length - 2];
				displayMode = true;
			}

			if (!parent) {
				return;
			}

			const value = toText(scope, { whitespace: "pre" });
			let result;

			try {
				result = katex.renderToString(value, {
					...settings,
					displayMode,
					throwOnError: true,
				});
			} catch (error) {
				const cause = error;
				file.message("Could not render math with KaTeX", {
					ancestors: [...parents, element],
					cause,
					place: element.position,
					ruleId: cause.name.toLowerCase(),
					source: "rehype-katex-mhchem",
				});

				try {
					result = katex.renderToString(value, {
						...settings,
						displayMode,
						strict: "ignore",
						throwOnError: false,
					});
				} catch {
					result = [
						{
							type: "element",
							tagName: "span",
							properties: {
								className: ["katex-error"],
								style: `color:${settings.errorColor || "#cc0000"}`,
								title: String(error),
							},
							children: [{ type: "text", value }],
						},
					];
				}
			}

			if (typeof result === "string") {
				const root = fromHtmlIsomorphic(result, { fragment: true });
				result = root.children;
			}

			const index = parent.children.indexOf(scope);
			parent.children.splice(index, 1, ...result);
			return SKIP;
		});
	};
}
