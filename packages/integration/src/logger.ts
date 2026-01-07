import { db } from "@mimir/db/client";
import { integrationLogs } from "@mimir/db/schema";

export const log = ({
	integrationId,
	level,
	key,
	message,
	details,
	inputTokens,
	outputTokens,
}: {
	integrationId: string;
	level: "info" | "error" | "warning";
	key: string;
	userLinkId?: string;
	message: string;
	details?: object;
	inputTokens?: number;
	outputTokens?: number;
}) => {
	console.log(`[${level.toUpperCase()}] ${message}`, details || "");
	db.insert(integrationLogs)
		.values({
			integrationId,
			level,
			key,
			message,
			details,
			inputTokens,
			outputTokens,
		})
		.catch((err) => {
			console.error("Failed to log integration event:", err);
		});
};
