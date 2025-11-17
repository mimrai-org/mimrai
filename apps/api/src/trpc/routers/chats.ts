import { getChatSchema, getChatsHistorySchema } from "@api/schemas/chat";
import { protectedProcedure, router } from "@api/trpc/init";
import { getChatById, getChatHistory } from "@mimir/db/queries/chats";

export const chatRouter = router({
	get: protectedProcedure.input(getChatSchema).query(async ({ ctx, input }) => {
		return getChatById(input.chatId, ctx.user.teamId!);
	}),
	history: protectedProcedure
		.input(getChatsHistorySchema)
		.query(async ({ ctx, input }) => {
			return getChatHistory(ctx.user.teamId!, input.search);
		}),
});
