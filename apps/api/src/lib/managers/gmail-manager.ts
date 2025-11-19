import type { IntegrationConfig } from "@mimir/integration/registry";
import * as cheerio from "cheerio";
import type { OAuth2Client } from "google-auth-library";
import { type gmail_v1, google } from "googleapis";

export class GmailManager {
	private auth: OAuth2Client;
	private gmail: gmail_v1.Gmail;
	private config: IntegrationConfig<"gmail">;

	constructor(config: IntegrationConfig<"gmail">) {
		this.config = config;
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
	 * Returns a simplified list of message metadata.
	 */
	async getNewMessages() {
		const query = this.buildSearchQuery();

		const response = await this.gmail.users.messages.list({
			userId: "me",
			q: query,
			maxResults: 50, // Batch size limit
		});

		const messages = response.data.messages || [];
		if (messages.length === 0) return [];

		// Fetch basic metadata for filtering (snippet + headers)
		const detailedMessages = await Promise.all(
			messages.map(async (msg) => {
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
	 * Sanitizes HTML content to plain text/simple HTML.
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

				let body = "";
				if (payload.parts) {
					body = this.findBody(payload.parts);
				} else if (payload.body?.data) {
					body = Buffer.from(payload.body.data, "base64").toString("utf-8");
				}

				const sanitizedBody = this.sanitizeContent(body);

				return {
					id,
					subject,
					from,
					date,
					body: sanitizedBody,
					originalBody: body, // Keep original if needed for advanced parsing later
				};
			}),
		);

		return contents.filter((c) => c !== null);
	}

	/**
	 * Helper to find the text/html or text/plain part of the email
	 */
	private findBody(parts: gmail_v1.Schema$MessagePart[]): string {
		// Prefer HTML to preserve some structure, then Plain Text
		const htmlPart = parts.find((p) => p.mimeType === "text/html");
		if (htmlPart?.body?.data) {
			return Buffer.from(htmlPart.body.data, "base64").toString("utf-8");
		}

		const textPart = parts.find((p) => p.mimeType === "text/plain");
		if (textPart?.body?.data) {
			return Buffer.from(textPart.body.data, "base64").toString("utf-8");
		}

		// Recursive search for nested multipart
		for (const part of parts) {
			if (part.parts) {
				const result = this.findBody(part.parts);
				if (result) return result;
			}
		}

		return "";
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
	 */
	private filterMessages(messages: gmail_v1.Schema$Message[]) {
		const { mode, allowDomains, allowSenders, denyDomains, denySenders } =
			this.config;

		return messages.filter((msg) => {
			const headers = msg.payload?.headers;
			const fromHeader = headers?.find((h) => h.name === "From")?.value || "";
			const emailMatch = fromHeader.match(/<(.+)>/);
			const senderEmail = emailMatch ? emailMatch[1] : fromHeader;
			const senderDomain = senderEmail.split("@")[1];

			// normalize for comparison
			const sEmail = senderEmail.toLowerCase();
			const sDomain = senderDomain?.toLowerCase();

			if (mode === "strict_allow") {
				const isAllowedSender = allowSenders.some((allowed) =>
					sEmail.includes(allowed.toLowerCase()),
				);
				const isAllowedDomain = allowDomains.some(
					(allowed) => sDomain === allowed.toLowerCase(),
				);
				return isAllowedSender || isAllowedDomain;
			}

			if (mode === "strict_deny" || mode === "auto") {
				const isDeniedSender = denySenders.some((denied) =>
					sEmail.includes(denied.toLowerCase()),
				);
				const isDeniedDomain = denyDomains.some(
					(denied) => sDomain === denied.toLowerCase(),
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

		// Time filter
		if (lastSyncedAt) {
			const seconds = Math.floor(new Date(lastSyncedAt).getTime() / 1000);
			parts.push(`after:${seconds}`);
		} else {
			parts.push("newer_than:1d"); // Default to last 24h if first sync
		}

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
