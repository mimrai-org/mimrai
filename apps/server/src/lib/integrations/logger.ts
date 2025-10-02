import { db } from "@/db";
import { integrationLogs } from "@/db/schema/schemas";

export const log = (
	integrationId: string,
	level: "info" | "error",
	message: string,
	details?: object,
) => {
	console.log(`[${level.toUpperCase()}] ${message}`, details || "");
	db.insert(integrationLogs)
		.values({
			integrationId,
			level,
			message,
			details,
		})
		.catch((err) => {
			console.error("Failed to log integration event:", err);
		});
};
