import { openai } from "@ai-sdk/openai";
import { db } from "@mimir/db/client";
import {
	createIntakeItem,
	updateIntakeItemAnalysis,
} from "@mimir/db/queries/intake";
import { intake as intakeTable } from "@mimir/db/schema";
import type { IntegrationConfig } from "@mimir/integration/registry";
import { generateObject } from "ai";
import { and, eq } from "drizzle-orm";
import z from "zod";
import type { GmailManager } from "./manager";

const emailFilterSchema = z.object({
	actionableIds: z
		.array(z.string())
		.describe(
			"IDs of emails that contain actionable tasks, meetings, or requests",
		),
});

const taskExtractionSchema = z.object({
	suggestedTitle: z.string().describe("Concise title for the task"),
	suggestedDescription: z.string().describe("Detailed description of the task"),
	suggestedSubtasks: z
		.array(z.string())
		.optional()
		.describe("List of subtasks if applicable"),
	suggestedDueDate: z
		.string()
		.optional()
		.describe("ISO date if a deadline is mentioned"),
});

export class IntakeManager {
	/**
	 * Process a batch of Gmail messages through the intake pipeline.
	 * Level 2 (Cheap AI Filter) -> Fetch Body -> Level 3 (Save + Analyze)
	 */
	async processGmailBatch(
		userId: string | undefined,
		teamId: string,
		config: IntegrationConfig<"gmail">,
		messages: Awaited<ReturnType<GmailManager["getNewMessages"]>>,
		gmailManager: GmailManager,
	) {
		if (messages.length === 0) return 0;

		// LEVEL 2: Cheap AI Filter (split into smaller batches to avoid prompt overload)
		const MAX_EMAILS_PER_PROMPT = 10;
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
				const { object } = await generateObject({
					model: "openai/gpt-4o-mini",
					schema: emailFilterSchema,
					system: `You are an expert executive assistant. Your job is to filter incoming emails.
					Return the IDs of emails that appear to be ACTIONABLE tasks, meetings, requests for information, or decisions.
					
					STRICTLY IGNORE:
					- Newsletters
					- Marketing/Promotions
					- Receipts/Invoices (unless they require approval)
					- Automated notifications (unless they are alerts requiring action)
					- Social media notifications
					- "No Reply" confirmations`,
					prompt: `Analyze this batch of email metadata and return the IDs of actionable items:
					${JSON.stringify(metadataBatch, null, 2)}`,
				});

				allApprovedIds.push(...object.actionableIds);
			} catch (error) {
				console.error(`AI Filter batch ${i} failed:`, error);
				// Continue with next batch instead of failing entirely
			}
		}

		if (allApprovedIds.length === 0) return 0;

		// Validate that approved IDs actually exist in our messages
		const validMessageIds = new Set(messages.map((m) => m.id));
		const approvedIds = allApprovedIds.filter((id) => validMessageIds.has(id));

		if (approvedIds.length === 0) return 0;

		// FETCH FULL CONTENT for approved items
		const fullEmails = await gmailManager.fetchFullContent(approvedIds);

		// LEVEL 3: Save to DB with duplicate prevention and AI analysis
		let savedCount = 0;

		for (const email of fullEmails) {
			try {
				// Check if this email already exists
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
					continue; // Skip duplicate
				}

				// Create intake item
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

				// Level 3: Deep AI Analysis (async, non-blocking)
				this.analyzeEmailContent(intakeItem.id, teamId, email.body).catch(
					(err) => {
						console.error(`Failed to analyze email ${email.id}:`, err);
					},
				);

				savedCount++;
			} catch (error) {
				console.error(`Failed to save intake item ${email.id}:`, error);
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
		emailBody: string,
	) {
		try {
			const { object } = await generateObject({
				model: "openai/gpt-4o-mini",
				schema: taskExtractionSchema,
				system: `You are an expert project manager. Extract actionable task information from email content.
				
				- Create a concise, actionable title (3-5 words).
				- Write a clear description of what needs to be done.
				- If there are multiple steps mentioned, list them as subtasks.
				- If a deadline or due date is mentioned, extract it as ISO date.`,
				prompt: `Extract task information from this email:
				
				${emailBody.substring(0, 4000)}`, // Limit to avoid token overflow
			});

			// Update the intake item with AI analysis
			await updateIntakeItemAnalysis({
				id: intakeId,
				teamId,
				aiAnalysis: {
					suggestedTitle: object.suggestedTitle,
					suggestedDescription: object.suggestedDescription,
					suggestedSubtasks: object.suggestedSubtasks,
				},
			});
		} catch (error) {
			// Log but don't fail the whole batch
			console.error("Failed Level 3 AI analysis:", error);
		}
	}
}
