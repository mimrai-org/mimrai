import { db } from "@mimir/db/client";
import { integrationLogs } from "@mimir/db/schema";

export async function logIntegrationError(
	integrationId: string,
	message: string,
	details?: Record<string, any>,
	tokens?: { input?: number; output?: number },
) {
	try {
		await db.insert(integrationLogs).values({
			integrationId,
			level: "error",
			message,
			details: details || null,
			inputTokens: tokens?.input || null,
			outputTokens: tokens?.output || null,
		});
	} catch (error) {
		// Fallback to console if DB logging fails
		console.error("Failed to log to integration_logs:", error);
		console.error("Original error:", message, details);
	}
}

export async function logIntegrationInfo(
	integrationId: string,
	message: string,
	details?: Record<string, any>,
	tokens?: { input?: number; output?: number },
) {
	try {
		await db.insert(integrationLogs).values({
			integrationId,
			level: "info",
			message,
			details: details || null,
			inputTokens: tokens?.input || null,
			outputTokens: tokens?.output || null,
		});
	} catch (error) {
		console.error("Failed to log to integration_logs:", error);
	}
}

