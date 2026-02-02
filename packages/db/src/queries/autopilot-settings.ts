import { eq } from "drizzle-orm";
import { db } from "..";
import {
	type AgentExecutionPolicy,
	autopilotSettings,
	defaultAgentExecutionPolicy,
} from "../schema";

export const upsertAutopilotSettings = async ({
	teamId,
	...input
}: {
	teamId: string;
	enabled?: boolean;
	allowedWeekdays?: number[] | null;
	enableFollowUps?: boolean;
	agentExecutionPolicy?: AgentExecutionPolicy;
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
				agentExecutionPolicy: defaultAgentExecutionPolicy,
			})
			.returning();
		return created;
	}

	return settings;
};

/**
 * Get agent execution policy for a team
 */
export const getAgentExecutionPolicy = async (
	teamId: string,
): Promise<AgentExecutionPolicy> => {
	const settings = await getAutopilotSettingsByTeamId(teamId);
	return settings?.agentExecutionPolicy ?? defaultAgentExecutionPolicy;
};

/**
 * Update agent execution policy for a team
 */
export const updateAgentExecutionPolicy = async (
	teamId: string,
	policy: Partial<AgentExecutionPolicy>,
) => {
	const current = await getAgentExecutionPolicy(teamId);
	const updatedPolicy: AgentExecutionPolicy = {
		...current,
		...policy,
	};

	return upsertAutopilotSettings({
		teamId,
		agentExecutionPolicy: updatedPolicy,
	});
};

/**
 * Check if agent execution is enabled for a team
 */
export const isAgentExecutionEnabled = async (
	teamId: string,
): Promise<boolean> => {
	const policy = await getAgentExecutionPolicy(teamId);
	return policy.enabled;
};
