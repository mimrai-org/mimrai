import { generateTeamPrefix } from "@mimir/utils/teams";
import { eq, isNull } from "drizzle-orm";
import { generateUniqueTeamSlug } from "src/queries/teams";
import { db } from "./../";
import { teams } from "../schema";

const missing = await db.select().from(teams).where(isNull(teams.slug));

for (const row of missing) {
	if (row.slug) continue;
	const newSlug = await generateUniqueTeamSlug(row.name);
	const prefix = generateTeamPrefix(row.name);

	await db
		.update(teams)
		.set({ slug: newSlug, prefix })
		.where(eq(teams.id, row.id));
}
