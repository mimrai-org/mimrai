import { getChatById } from "@/db/queries/chats";
import { getChatSchema } from "@/schemas/chat";
import { protectedProcedure, router } from "@/trpc/init";

export const chatRouter = router({
	get: protectedProcedure.input(getChatSchema).query(async ({ ctx, input }) => {
		return getChatById(input.chatId, ctx.user.teamId!);
	}),
});
