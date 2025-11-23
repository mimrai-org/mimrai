import {
	createChatFeedbackSchema,
	deleteChatFeedbackSchema,
} from "@api/schemas/feedback";
import { protectedProcedure, router } from "@api/trpc/init";
import { chatFeedbackCache } from "@mimir/cache/chat-feedback-cache";

export const chatFeedbackRouter = router({
	create: protectedProcedure
		.input(createChatFeedbackSchema)
		.mutation(async ({ input, ctx }) => {
			await chatFeedbackCache.set(input.chatId, input.messageId, ctx.user.id, {
				type: input.type,
				comment: input.comment,
				createdAt: new Date().toISOString(),
				teamId: ctx.user.teamId!,
			});

			return { success: true };
		}),

	delete: protectedProcedure
		.input(deleteChatFeedbackSchema)
		.mutation(async ({ input, ctx: { session } }) => {
			await chatFeedbackCache.delete(
				input.chatId,
				input.messageId,
				session.user.id,
			);

			return { success: true };
		}),
});
