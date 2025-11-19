import type { IntegrationConfig } from "@mimir/integration/registry";
import * as cheerio from "cheerio";
import type { OAuth2Client } from "google-auth-library";
import { type gmail_v1, google } from "googleapis";

// Constants
const MAX_RESULTS_PER_PAGE = 50;
const MAX_TOTAL_MESSAGES = 50;

/**
 * Decode Gmail's base64url-encoded strings
 */
function decodeBase64Url(data: string): string {
	const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
	return Buffer.from(base64, "base64").toString("utf-8");
}

export class GmailManager {
	private auth: OAuth2Client;
	private gmail: gmail_v1.Gmail;
	private config: IntegrationConfig<"gmail">;

	constructor(config: IntegrationConfig<"gmail">) {
		this.config = config;

		if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
			throw new Error(
				"Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables",
			);
		}

		this.auth = new google.auth.OAuth2(
			process.env.GOOGLE_CLIENT_ID,
			process.env.GOOGLE_CLIENT_SECRET,
		);

		this.auth.setCredentials({
			refresh_token: config.refreshToken,
			access_token: config.accessToken,
			expiry_date: config.expiresAt,
		});

		this.gmail = google.gmail({ version: "v1", auth: this.auth });
	}

	/**
	 * Search for messages based on the configuration mode and last sync time.
	 * Returns a simplified list of message metadata with pagination support.
	 */
	async getNewMessages() {
		const query = this.buildSearchQuery();
		const allMessages: gmail_v1.Schema$Message[] = [];
		let pageToken: string | undefined;

		// Paginate through results
		do {
			const response = await this.gmail.users.messages.list({
				userId: "me",
				q: query,
				maxResults: MAX_RESULTS_PER_PAGE,
				pageToken,
			});

			const messages = response.data.messages || [];
			allMessages.push(...messages);

			pageToken = response.data.nextPageToken || undefined;

			// Stop if we hit our total limit
			if (allMessages.length >= MAX_TOTAL_MESSAGES) {
				break;
			}
		} while (pageToken);

		if (allMessages.length === 0) return [];

		// Fetch basic metadata for filtering (snippet + headers)
		const detailedMessages = await Promise.all(
			allMessages.slice(0, MAX_TOTAL_MESSAGES).map(async (msg) => {
				const details = await this.gmail.users.messages.get({
					userId: "me",
					id: msg.id!,
					format: "metadata",
					metadataHeaders: ["From", "Subject", "Date"],
				});
				return details.data;
			}),
		);

		return this.filterMessages(detailedMessages);
	}

	/**
	 * Fetch full content for a list of message IDs.
	 * Returns both sanitized text and original HTML.
	 */
	async fetchFullContent(messageIds: string[]) {
		const contents = await Promise.all(
			messageIds.map(async (id) => {
				const response = await this.gmail.users.messages.get({
					userId: "me",
					id: id,
					format: "full",
				});

				const payload = response.data.payload;
				if (!payload) return null;

				const subject =
					payload.headers?.find((h) => h.name === "Subject")?.value ||
					"No Subject";
				const from =
					payload.headers?.find((h) => h.name === "From")?.value || "Unknown";
				const date = payload.headers?.find((h) => h.name === "Date")?.value;

				let bodyHtml = "";
				let bodyPlain = "";

				if (payload.parts) {
					const { html, plain } = this.findBody(payload.parts);
					bodyHtml = html;
					bodyPlain = plain;
				} else if (payload.body?.data) {
					const decoded = decodeBase64Url(payload.body.data);
					if (payload.mimeType?.includes("html")) {
						bodyHtml = decoded;
						bodyPlain = this.sanitizeContent(decoded);
					} else {
						bodyPlain = decoded;
					}
				}

				// If we have HTML but not plain, generate plain
				if (bodyHtml && !bodyPlain) {
					bodyPlain = this.sanitizeContent(bodyHtml);
				}

				return {
					id,
					subject,
					from,
					date,
					body: bodyPlain, // Sanitized text for AI processing
					originalHtml: bodyHtml, // Original HTML for display
				};
			}),
		);

		return contents.filter((c) => c !== null);
	}

	/**
	 * Helper to find the text/html and text/plain parts of the email
	 */
	private findBody(parts: gmail_v1.Schema$MessagePart[]): {
		html: string;
		plain: string;
	} {
		let html = "";
		let plain = "";

		// Look for HTML and plain text parts
		const htmlPart = parts.find((p) => p.mimeType === "text/html");
		if (htmlPart?.body?.data) {
			html = decodeBase64Url(htmlPart.body.data);
		}

		const textPart = parts.find((p) => p.mimeType === "text/plain");
		if (textPart?.body?.data) {
			plain = decodeBase64Url(textPart.body.data);
		}

		// Recursive search for nested multipart
		if (!html && !plain) {
			for (const part of parts) {
				if (part.parts) {
					const result = this.findBody(part.parts);
					if (result.html || result.plain) {
						return result;
					}
				}
			}
		}

		return { html, plain };
	}

	/**
	 * Clean HTML content using Cheerio
	 */
	private sanitizeContent(html: string): string {
		const $ = cheerio.load(html);

		// Remove scripts, styles, and tracking pixels
		$("script").remove();
		$("style").remove();
		$("img").remove();
		$("link").remove();

		// Get text, condensing whitespace
		return $.text().replace(/\s\s+/g, " ").trim();
	}

	/**
	 * Filter messages based on application-layer logic (Strict Allow/Deny)
	 * Uses EXACT matching for emails and domains to prevent bypass attacks
	 */
	private filterMessages(messages: gmail_v1.Schema$Message[]) {
		const { mode, allowDomains, allowSenders, denyDomains, denySenders } =
			this.config;

		return messages.filter((msg) => {
			const headers = msg.payload?.headers;
			const fromHeader = headers?.find((h) => h.name === "From")?.value || "";
			const emailMatch = fromHeader.match(/<(.+)>/);
			const senderEmail = emailMatch ? emailMatch[1] : fromHeader;
			const senderDomain = senderEmail?.split("@")[1];

			// Normalize for comparison
			const sEmail = senderEmail?.toLowerCase().trim() || "";
			const sDomain = senderDomain?.toLowerCase().trim() || "";

			if (mode === "strict_allow") {
				// Exact match for allowed senders or domains
				const isAllowedSender = allowSenders.some(
					(allowed) => sEmail === allowed.toLowerCase().trim(),
				);
				const isAllowedDomain = allowDomains.some(
					(allowed) => sDomain === allowed.toLowerCase().trim(),
				);
				return isAllowedSender || isAllowedDomain;
			}

			if (mode === "strict_deny" || mode === "auto") {
				// Exact match for denied senders or domains
				const isDeniedSender = denySenders.some(
					(denied) => sEmail === denied.toLowerCase().trim(),
				);
				const isDeniedDomain = denyDomains.some(
					(denied) => sDomain === denied.toLowerCase().trim(),
				);

				if (isDeniedSender || isDeniedDomain) return false;
			}

			return true;
		});
	}

	/**
	 * Build the Gmail API query string
	 */
	private buildSearchQuery(): string {
		const { lastSyncedAt, mode, allowDomains, allowSenders, denyDomains } =
			this.config;
		const parts: string[] = [];

		// // Time filter
		// if (lastSyncedAt) {
		// 	const seconds = Math.floor(new Date(lastSyncedAt).getTime() / 1000);
		// 	parts.push(`after:${seconds}`);
		// } else {
		// 	parts.push("newer_than:1d"); // Default to last 24h if first sync
		// }

		parts.push("newer_than:1d");

		// Category filter (exclude noise)
		parts.push("-category:promotions");
		parts.push("-category:social");

		// API-Level filtering optimization
		if (mode === "strict_allow") {
			// Construct OR query: from:(a.com OR b.com OR user@c.com)
			const allowList = [...allowDomains, ...allowSenders];
			if (allowList.length > 0) {
				parts.push(`from:(${allowList.join(" OR ")})`);
			}
		} else if (mode === "strict_deny" || mode === "auto") {
			// Construct exclusion query: -from:(bad.com OR spam.com)
			if (denyDomains.length > 0) {
				parts.push(`-from:(${denyDomains.join(" OR ")})`);
			}
		}

		return parts.join(" ");
	}
}
