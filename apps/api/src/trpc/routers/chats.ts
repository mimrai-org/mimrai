import { memoryProvider } from "@api/ai/agents/config/shared";
import { getChatHistorySchema, getChatSchema } from "@api/schemas/chat";
import { protectedProcedure, router } from "@api/trpc/init";

export const chatRouter = router({
	get: protectedProcedure.input(getChatSchema).query(async ({ ctx, input }) => {
		return memoryProvider.getMessages({
			chatId: input.chatId,
			userId: ctx.user.id,
			limit: 50,
		});
	}),

	history: protectedProcedure
		.input(getChatHistorySchema)
		.query(async ({ ctx, input }) => {
			return memoryProvider.getChats({
				search: input.search,
				userId: ctx.user.id,
				limit: 10,
			});
		}),
});
