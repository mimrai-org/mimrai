import {
	createMcpServerSchema,
	deleteMcpServerSchema,
	getMcpServerByIdSchema,
	getMcpServersSchema,
	updateMcpServerSchema,
} from "@api/schemas/mcp-servers";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	createMcpServer,
	deleteMcpServer,
	getMcpServerById,
	getMcpServers,
	updateMcpServer,
} from "@mimir/db/queries/mcp-servers";

export const mcpServersRouter = router({
	list: protectedProcedure
		.input(getMcpServersSchema)
		.query(async ({ ctx, input }) => {
			return getMcpServers({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	getById: protectedProcedure
		.input(getMcpServerByIdSchema)
		.query(async ({ ctx, input }) => {
			return getMcpServerById({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	create: protectedProcedure
		.input(createMcpServerSchema)
		.mutation(async ({ ctx, input }) => {
			return createMcpServer({
				...input,
				teamId: ctx.user.teamId!,
				createdBy: ctx.user.id,
			});
		}),

	update: protectedProcedure
		.input(updateMcpServerSchema)
		.mutation(async ({ ctx, input }) => {
			return updateMcpServer({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	delete: protectedProcedure
		.input(deleteMcpServerSchema)
		.mutation(async ({ ctx, input }) => {
			return deleteMcpServer({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),
});
