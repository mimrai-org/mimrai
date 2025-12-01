import { upsertAutopilotSettingsSchema } from "@api/schemas/autopilot-settings";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	getAutopilotSettingsByTeamId,
	upsertAutopilotSettings,
} from "@mimir/db/queries/autopilot-settings";

export const autopilotSettingsRouter = router({
	get: protectedProcedure.query(async ({ ctx, input }) => {
		return getAutopilotSettingsByTeamId(ctx.user.teamId!);
	}),

	upsert: protectedProcedure
		.input(upsertAutopilotSettingsSchema)
		.mutation(async ({ ctx, input }) => {
			return upsertAutopilotSettings({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),
});
