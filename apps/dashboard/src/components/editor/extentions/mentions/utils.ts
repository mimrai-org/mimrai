import type {
	JSONContent,
	MarkdownParseHelpers,
	MarkdownRendererHelpers,
	MarkdownToken,
	MarkdownTokenizer,
	RenderContext,
} from "@tiptap/react";

export function getMarkdownTokenizerOptions({
	entityName,
}: {
	entityName: string;
}) {
	return {
		markdownTokenName: `${entityName}_mention`,
		parseMarkdown: (token: MarkdownToken, helpers: MarkdownParseHelpers) => {
			const content = helpers.parseInline(token.tokens || []);
			const match = new RegExp(`^@${entityName}:\\[(.+?)\\]\\((.+?)\\)`).exec(
				token.raw,
			);
			if (match) {
				const [, label, id] = match;
				return {
					type: `${entityName}Mention`,
					attrs: {
						id,
						label: label,
					},
					content,
				};
			}
			return null;
		},
		renderMarkdown(
			node: JSONContent,
			helpers: MarkdownRendererHelpers,
			ctx: RenderContext,
		) {
			return `@${entityName}:[${node.attrs.label}](${node.attrs.id})`;
		},
		markdownTokenizer: {
			name: `${entityName}_mention`,
			level: "inline",
			start(src) {
				return src.indexOf(`@${entityName}:`);
			},
			tokenize(src, tokens, lexer) {
				const match = new RegExp(`^@${entityName}:\\[(.+?)\\]\\((.+?)\\)`).exec(
					src,
				);
				if (match) {
					return {
						type: `${entityName}_mention`,
						raw: match[0],
						text: match[1],
						tokens: lexer.inlineTokens(match[1]),
					};
				}
				return undefined;
			},
		} as MarkdownTokenizer,
	};
}
