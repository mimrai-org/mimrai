import * as cheerio from "cheerio";
import type { gmail_v1 } from "googleapis";

/**
 * Helper to find the text/html and text/plain parts of the email
 */
export const findBody = (
	parts: gmail_v1.Schema$MessagePart[],
): {
	html: string;
	plain: string;
} => {
	let html = "";
	let plain = "";

	const htmlPart = parts.find((p) => p.mimeType === "text/html");
	if (htmlPart?.body?.data) {
		html = decodeBase64Url(htmlPart.body.data);
	}

	const textPart = parts.find((p) => p.mimeType === "text/plain");
	if (textPart?.body?.data) {
		plain = decodeBase64Url(textPart.body.data);
	}

	if (!html && !plain) {
		for (const part of parts) {
			if (part.parts) {
				const result = findBody(part.parts);
				if (result.html || result.plain) {
					return result;
				}
			}
		}
	}

	return { html, plain };
};

/**
 * Decode Gmail's base64url-encoded strings
 */
export const decodeBase64Url = (data: string): string => {
	const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
	return Buffer.from(base64, "base64").toString("utf-8");
};

/**
 * Clean HTML content using Cheerio
 */
export const sanitizeContent = (html: string): string => {
	const $ = cheerio.load(html);

	$("script").remove();
	$("style").remove();
	$("img").remove();
	$("link").remove();

	return $.text().replace(/\s\s+/g, " ").trim();
};
