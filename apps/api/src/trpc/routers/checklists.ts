import {
  createChecklistItemSchema,
  deleteChecklistItemSchema,
  getChecklistItemsSchema,
  updateChecklistItemSchema,
} from "@api/schemas/checklists";
import { protectedProcedure, router } from "@api/trpc/init";
import {
  createChecklistItem,
  deleteChecklistItem,
  getChecklistItems,
  updateChecklistItem,
} from "@mimir/db/queries/checklists";

export const checklistsRouter = router({
  get: protectedProcedure
    .input(getChecklistItemsSchema)
    .query(async ({ ctx, input }) => {
      return getChecklistItems({
        ...input,
        teamId: ctx.user.teamId!,
      });
    }),

  create: protectedProcedure
    .input(createChecklistItemSchema)
    .mutation(async ({ ctx, input }) => {
      return await createChecklistItem({
        ...input,
        teamId: ctx.user.teamId!,
        userId: ctx.user.id,
      });
    }),

  update: protectedProcedure
    .input(updateChecklistItemSchema)
    .mutation(async ({ ctx, input }) => {
      return updateChecklistItem({
        ...input,
        teamId: ctx.user.teamId!,
        userId: ctx.user.id,
      });
    }),

  delete: protectedProcedure
    .input(deleteChecklistItemSchema)
    .mutation(async ({ ctx, input }) => {
      return deleteChecklistItem({
        ...input,
        teamId: ctx.user.teamId!,
      });
    }),
});
