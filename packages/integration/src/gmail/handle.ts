import { db } from "@mimir/db/client";
import {
	createIntakeItem,
	updateIntakeItemAnalysis,
} from "@mimir/db/queries/intake";
import { intake as intakeTable } from "@mimir/db/schema";
import type { IntegrationConfig } from "@mimir/integration/registry";
import { generateObject } from "ai";
import * as cheerio from "cheerio";
import { and, eq } from "drizzle-orm";
import { type gmail_v1, google } from "googleapis";
import z from "zod";

// Constants
const MAX_RESULTS_PER_PAGE = 50;
const MAX_TOTAL_MESSAGES = 50;
const MAX_EMAILS_PER_PROMPT = 10;

/**
 * Decode Gmail's base64url-encoded strings
 */
function decodeBase64Url(data: string): string {
	const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
	return Buffer.from(base64, "base64").toString("utf-8");
}

// AI Schemas
const emailFilterSchema = z.object({
	actionableIds: z
		.array(z.string())
		.describe(
			"IDs of emails that contain actionable tasks, meetings, requests, or decisions that require follow-up",
		),
	reasoning: z
		.string()
		.optional()
		.describe("Brief explanation of filtering decisions"),
});

const taskExtractionSchema = z.object({
	suggestedTitle: z
		.string()
		.describe(
			"Clear, actionable task title (3-8 words). Should start with a verb when possible.",
		),
	suggestedDescription: z
		.string()
		.describe(
			"Comprehensive description including context, requirements, and expected outcome",
		),
	summary: z
		.string()
		.describe("One-sentence summary of the task for quick reference"),
	suggestedSubtasks: z
		.array(z.string())
		.optional()
		.describe(
			"Actionable subtasks or checklist items if multiple steps are needed",
		),
	actionItems: z
		.array(z.string())
		.optional()
		.describe("Specific action items extracted from the email"),
	suggestedDueDate: z
		.string()
		.optional()
		.describe(
			"ISO 8601 date string if a deadline is mentioned or can be inferred",
		),
	suggestedPriority: z
		.enum(["low", "medium", "high", "urgent"])
		.optional()
		.describe(
			"Priority level based on urgency indicators, deadlines, or sender importance",
		),
	confidence: z
		.number()
		.min(0)
		.max(1)
		.describe(
			"Confidence score (0-1) in the task extraction accuracy. Lower if email is ambiguous.",
		),
	category: z
		.string()
		.optional()
		.describe(
			"Task category: meeting, request, decision, review, followup, etc.",
		),
});

export class GmailHandle {
	private auth: InstanceType<typeof google.auth.OAuth2>;
	private gmail: gmail_v1.Gmail;
	private config: IntegrationConfig<"gmail">;
	private logger?: {
		info: (message: string, extra?: Record<string, unknown>) => void;
		error: (message: string, extra?: Record<string, unknown>) => void;
	};

	constructor(
		config: IntegrationConfig<"gmail">,
		logger?: {
			info: (message: string, extra?: Record<string, unknown>) => void;
			error: (message: string, extra?: Record<string, unknown>) => void;
		},
	) {
		this.config = config;
		this.logger = logger;

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
	 * Main entry point: Process Gmail integration for a team
	 */
	async processIntegration(params: {
		userId: string | undefined;
		teamId: string;
	}): Promise<number> {
		const { userId, teamId } = params;

		try {
			// Level 0 & 1: Fetch new messages with metadata filtering
			const messages = await this.getNewMessages();

			this.logger?.info(
				`Found ${messages.length} new messages after Level 1 filter`,
			);

			if (messages.length === 0) return 0;

			// Level 2 & 3: AI filtering and task extraction
			return await this.processGmailBatch(userId, teamId, messages);
		} catch (error) {
			this.logger?.error(`Gmail processing failed: ${error}`);
			throw error;
		}
	}

	/**
	 * Search for messages based on the configuration mode and last sync time.
	 * Returns a simplified list of message metadata with pagination support.
	 */
	private async getNewMessages() {
		const query = this.buildSearchQuery();
		const allMessages: gmail_v1.Schema$Message[] = [];
		let pageToken: string | undefined;

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

			if (allMessages.length >= MAX_TOTAL_MESSAGES) {
				break;
			}
		} while (pageToken);

		if (allMessages.length === 0) return [];

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
	 * Process a batch of Gmail messages through the intake pipeline.
	 * Level 2 (Cheap AI Filter) -> Fetch Body -> Level 3 (Save + Analyze)
	 */
	private async processGmailBatch(
		userId: string | undefined,
		teamId: string,
		messages: Awaited<ReturnType<GmailHandle["getNewMessages"]>>,
	) {
		if (messages.length === 0) return 0;

		// LEVEL 2: Cheap AI Filter (split into smaller batches to avoid prompt overload)
		const allApprovedIds: string[] = [];

		for (let i = 0; i < messages.length; i += MAX_EMAILS_PER_PROMPT) {
			const batch = messages.slice(i, i + MAX_EMAILS_PER_PROMPT);
			const metadataBatch = batch.map((msg) => ({
				id: msg.id!,
				subject:
					msg.payload?.headers?.find((h) => h.name === "Subject")?.value ||
					"No Subject",
				snippet: msg.snippet || "",
				sender:
					msg.payload?.headers?.find((h) => h.name === "From")?.value ||
					"Unknown",
			}));

			try {
				const startTime = Date.now();
				const { object, usage } = await generateObject({
					model: "openai/gpt-4o-mini",
					schema: emailFilterSchema,
					system: `You are an expert executive assistant with years of experience managing inboxes for busy professionals.
					
Your task is to identify emails that require ACTION, RESPONSE, or DECISION-MAKING from the recipient.

INCLUDE emails that:
- Request information, approval, or decisions
- Contain meeting invites or scheduling requests
- Require follow-up or response
- Mention deadlines or time-sensitive matters
- Ask questions that need answers (unless they are purely informational)
- Delegate tasks or assignments
- Report issues or problems requiring attention

EXCLUDE emails that:
- Are newsletters, digests, notifications, or automated reports (unless they contain alerts)
- Are purely informational with no action needed
- Are marketing, promotions, or advertisements
- Are social media notifications
- Are receipts or invoices (unless they require approval)
- Are "no-reply" confirmations
- Are automated notifications with no action items

When in doubt, err on the side of INCLUDING the email. It's better to surface a potentially actionable email than to miss an important task.`,
					prompt: `Analyze this batch of email metadata and return the IDs of emails that appear actionable:

${JSON.stringify(metadataBatch, null, 2)}

Return both the IDs and a brief reasoning for your filtering decisions.`,
					temperature: 0.3,
				});

				const duration = Date.now() - startTime;
				this.logger?.info(
					`Level 2 AI filter batch ${i / MAX_EMAILS_PER_PROMPT + 1}: ${object.actionableIds.length}/${batch.length} actionable (${duration}ms, ${usage.totalTokens} tokens)`,
				);

				allApprovedIds.push(...object.actionableIds);
			} catch (error) {
				this.logger?.error(`AI Filter batch ${i} failed: ${error}`);
			}
		}

		if (allApprovedIds.length === 0) {
			this.logger?.info("No actionable emails found after Level 2 filtering");
			return 0;
		}

		const validMessageIds = new Set(messages.map((m) => m.id));
		const approvedIds = allApprovedIds.filter((id) => validMessageIds.has(id));

		if (approvedIds.length === 0) {
			this.logger?.error("AI returned invalid message IDs, skipping");
			return 0;
		}

		this.logger?.info(
			`Fetching full content for ${approvedIds.length} actionable emails`,
		);

		const fullEmails = await this.fetchFullContent(approvedIds);

		// LEVEL 3: Save to DB with duplicate prevention and AI analysis
		let savedCount = 0;

		for (const email of fullEmails) {
			try {
				const existing = await db
					.select()
					.from(intakeTable)
					.where(
						and(
							eq(intakeTable.teamId, teamId),
							eq(intakeTable.sourceMessageId, email.id),
						),
					)
					.limit(1);

				if (existing.length > 0) {
					this.logger?.info(`Skipping duplicate email: ${email.id}`);
					continue;
				}

				const intakeItem = await createIntakeItem({
					teamId,
					userId: userId || undefined,
					source: "gmail",
					content: email.body,
					sourceMessageId: email.id,
					status: "pending",
					metadata: {
						emailId: email.id,
						sender: email.from || undefined,
						subject: email.subject || undefined,
						date: email.date || undefined,
						snippet:
							messages.find((m) => m.id === email.id)?.snippet || undefined,
						originalHtml: email.originalHtml || undefined,
					},
				});

				this.logger?.info(
					`Created intake item ${intakeItem!.id} for email: ${email.subject}`,
				);

				// Level 3: Deep AI Analysis (async, non-blocking)
				this.analyzeEmailContent(intakeItem!.id, teamId, {
					subject: email.subject,
					from: email.from,
					body: email.body,
					date: email.date || undefined,
				}).catch((err) => {
					this.logger?.error(`Failed to analyze email ${email.id}: ${err}`);
				});

				savedCount++;
			} catch (error) {
				this.logger?.error(`Failed to save intake item ${email.id}: ${error}`);
			}
		}

		return savedCount;
	}

	/**
	 * Level 3: Analyze email content with stronger AI to extract task details.
	 */
	private async analyzeEmailContent(
		intakeId: string,
		teamId: string,
		email: { subject: string; from: string; body: string; date?: string },
	) {
		try {
			const startTime = Date.now();
			const { object, usage } = await generateObject({
				model: "openai/gpt-4o",
				schema: taskExtractionSchema,
				system: `You are an expert project manager and task coordinator. Your role is to transform emails into clear, actionable tasks.

GUIDELINES:
1. Title: Create a concise, action-oriented title (3-8 words). Start with a verb when possible (e.g., "Review Q4 budget proposal", "Schedule team meeting", "Respond to client feedback").

2. Description: Provide a comprehensive description that includes:
   - What needs to be done
   - Why it's important (context)
   - Any relevant background information
   - Expected outcome or deliverable

3. Summary: One clear sentence capturing the essence of the task.

4. Subtasks: Break down complex tasks into specific, ordered steps. Only include if there are multiple clear steps.

5. Action Items: Extract specific, concrete actions mentioned in the email.

6. Due Date: Extract or infer deadlines. Look for:
   - Explicit dates ("by Friday", "before June 15")
   - Relative dates ("end of week", "next Monday")
   - Implied urgency ("ASAP", "urgent", "as soon as possible")
   Convert to ISO 8601 format (YYYY-MM-DD).

7. Priority: Assess based on:
   - Explicit urgency indicators ("urgent", "ASAP", "critical")
   - Deadlines (sooner = higher priority)
   - Sender importance (executives, clients)
   - Impact or consequences mentioned
   
8. Confidence: Rate 0-1 based on:
   - Clarity of the request (clear = high)
   - Ambiguity or missing information (ambiguous = low)
   - Complexity (simple = high, complex = medium)

9. Category: Classify the task type (meeting, request, decision, review, followup, approval, etc.)

Focus on extracting actionable information. If something is unclear, reflect that in the confidence score.`,
				prompt: `Extract detailed task information from this email:

From: ${email.from}
Subject: ${email.subject}
${email.date ? `Date: ${email.date}` : ""}

Body:
${email.body.substring(0, 4000)}`,
				temperature: 0.4,
			});

			const duration = Date.now() - startTime;
			this.logger?.info(
				`Level 3 AI analysis for ${intakeId}: ${object.suggestedTitle} (confidence: ${object.confidence}, ${duration}ms, ${usage.totalTokens} tokens)`,
			);

			// Update the intake item with AI analysis
			await updateIntakeItemAnalysis({
				id: intakeId,
				teamId,
				aiAnalysis: {
					suggestedTitle: object.suggestedTitle,
					suggestedDescription: object.suggestedDescription,
					summary: object.summary,
					suggestedSubtasks: object.suggestedSubtasks,
					actionItems: object.actionItems,
					suggestedDueDate: object.suggestedDueDate,
					suggestedPriority: object.suggestedPriority,
					confidence: object.confidence,
					category: object.category,
				},
			});

			this.logger?.info(`Updated AI analysis for intake item ${intakeId}`);
		} catch (error) {
			// Log but don't fail the whole batch
			this.logger?.error(`Failed Level 3 AI analysis: ${error}`);
		}
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

		$("script").remove();
		$("style").remove();
		$("img").remove();
		$("link").remove();

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

			const sEmail = senderEmail?.toLowerCase().trim() || "";
			const sDomain = senderDomain?.toLowerCase().trim() || "";

			if (mode === "strict_allow") {
				const isAllowedSender = allowSenders.some(
					(allowed) => sEmail === allowed.toLowerCase().trim(),
				);
				const isAllowedDomain = allowDomains.some(
					(allowed) => sDomain === allowed.toLowerCase().trim(),
				);
				return isAllowedSender || isAllowedDomain;
			}

			if (mode === "strict_deny" || mode === "auto") {
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

		// TODO: commented for test purposes
		// Time filter - using lastSyncedAt if available, otherwise last 24h
		// if (lastSyncedAt) {
		// 	const seconds = Math.floor(new Date(lastSyncedAt).getTime() / 1000);
		// 	parts.push(`after:${seconds}`);
		// } else {
		// 	parts.push("newer_than:1d");
		// }

		parts.push("newer_than:1d");

		parts.push("-category:promotions");
		parts.push("-category:social");

		// API-Level filtering optimization
		if (mode === "strict_allow") {
			const allowList = [...allowDomains, ...allowSenders];
			if (allowList.length > 0) {
				parts.push(`from:(${allowList.join(" OR ")})`);
			}
		} else if (mode === "strict_deny" || mode === "auto") {
			if (denyDomains.length > 0) {
				parts.push(`-from:(${denyDomains.join(" OR ")})`);
			}
		}

		return parts.join(" ");
	}
}
