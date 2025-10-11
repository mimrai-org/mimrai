import { db } from "@mimir/db/client";
import { integrationLogs } from "@mimir/db/schema";

export const log = (
	integrationId: string,
	level: "info" | "error",
	message: string,
	details?: object,
	inputTokens?: number,
	outputTokens?: number,
) => {
	console.log(`[${level.toUpperCase()}] ${message}`, details || "");
	db.insert(integrationLogs)
		.values({
			integrationId,
			level,
			message,
			details,
			inputTokens,
			outputTokens,
		})
		.catch((err) => {
			console.error("Failed to log integration event:", err);
		});
};
