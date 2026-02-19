import {
	deleteChatSchema,
	getChatSchema,
	getChatsHistorySchema,
} from "@api/schemas/chat";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	deleteChat,
	getChatById,
	getChatHistory,
} from "@mimir/db/queries/chats";

export const chatRouter = router({
	get: protectedProcedure.input(getChatSchema).query(async ({ ctx, input }) => {
		return getChatById(input.chatId, ctx.user.teamId!);
	}),
	history: protectedProcedure
		.input(getChatsHistorySchema)
		.query(async ({ ctx, input }) => {
			return getChatHistory({
				...input,
				teamId: ctx.user.teamId!,
				userId: ctx.user.id,
			});
		}),
	delete: protectedProcedure
		.input(deleteChatSchema)
		.mutation(async ({ ctx, input }) => {
			return deleteChat(input.chatId, ctx.user.teamId!);
		}),
});
