import {
	createDocumentSchema,
	deleteDocumentSchema,
	getDocumentByIdSchema,
	getDocumentPathSchema,
	getDocumentsSchema,
	reorderDocumentsSchema,
	updateDocumentSchema,
} from "@api/schemas/documents";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	createDocument,
	deleteDocument,
	getDocumentById,
	getDocumentPath,
	getDocuments,
	reorderDocuments,
	updateDocument,
} from "@mimir/db/queries/documents";

export const documentsRouter = router({
	get: protectedProcedure
		.input(getDocumentsSchema)
		.query(async ({ ctx, input }) => {
			return getDocuments({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	getById: protectedProcedure
		.input(getDocumentByIdSchema)
		.query(async ({ ctx, input }) => {
			return getDocumentById({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	getPath: protectedProcedure
		.input(getDocumentPathSchema)
		.query(async ({ ctx, input }) => {
			return getDocumentPath({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	create: protectedProcedure
		.input(createDocumentSchema)
		.mutation(async ({ ctx, input }) => {
			return createDocument({
				...input,
				teamId: ctx.user.teamId!,
				createdBy: ctx.user.id,
			});
		}),

	update: protectedProcedure
		.input(updateDocumentSchema)
		.mutation(async ({ ctx, input }) => {
			return updateDocument({
				...input,
				teamId: ctx.user.teamId!,
				updatedBy: ctx.user.id,
			});
		}),

	delete: protectedProcedure
		.input(deleteDocumentSchema)
		.mutation(async ({ ctx, input }) => {
			return deleteDocument({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	reorder: protectedProcedure
		.input(reorderDocumentsSchema)
		.mutation(async ({ ctx, input }) => {
			return reorderDocuments({
				items: input.items,
				teamId: ctx.user.teamId!,
			});
		}),
});
