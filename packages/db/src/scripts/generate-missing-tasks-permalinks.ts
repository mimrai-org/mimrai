import { eq, isNull } from "drizzle-orm";
import { generateTaskPermalinkId } from "src/queries/tasks";
import { db } from "..";
import { tasks } from "../schema";

const missing = await db.select().from(tasks).where(isNull(tasks.permalinkId));

for (const row of missing) {
	if (row.permalinkId) continue;

	const newPermalinkId = await generateTaskPermalinkId();
	await db
		.update(tasks)
		.set({ permalinkId: newPermalinkId })
		.where(eq(tasks.id, row.id));

	console.log(`Updated task ${row.id} with permalinkId ${newPermalinkId}`);
}
