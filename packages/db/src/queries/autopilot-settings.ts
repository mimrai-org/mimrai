import { eq } from "drizzle-orm";
import { db } from "..";
import { autopilotSettings } from "../schema";

export const upsertAutopilotSettings = async ({
	teamId,
	...input
}: {
	teamId: string;
	enabled?: boolean;
}) => {
	const [settings] = await db
		.insert(autopilotSettings)
		.values({
			...input,
			teamId,
		})
		.onConflictDoUpdate({
			target: autopilotSettings.teamId,
			set: {
				...input,
			},
		})
		.returning();

	return settings;
};

export const getAutopilotSettingsByTeamId = async (teamId: string) => {
	const [settings] = await db
		.select()
		.from(autopilotSettings)
		.where(eq(autopilotSettings.teamId, teamId))
		.limit(1);

	if (!settings) {
		const [created] = await db
			.insert(autopilotSettings)
			.values({
				teamId,
				enabled: false,
			})
			.returning();
		return created;
	}

	return settings;
};
