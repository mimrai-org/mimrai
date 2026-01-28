import { auth } from "@api/lib/auth";
import {
	createApiKeySchema,
	deleteApiKeySchema,
	listApiKeysSchema,
} from "@api/schemas/api-keys";
import { protectedProcedure, router } from "@api/trpc/init";
import { db } from "@mimir/db/client";
import { apikey } from "@mimir/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

export const apiKeysRouter = router({
	list: protectedProcedure
		.meta({ team: false })
		.input(listApiKeysSchema)
		.query(async ({ ctx }) => {
			const keys = await db
				.select({
					id: apikey.id,
					name: apikey.name,
					start: apikey.start,
					prefix: apikey.prefix,
					userId: apikey.userId,
					teamId: apikey.teamId,
					enabled: apikey.enabled,
					expiresAt: apikey.expiresAt,
					createdAt: apikey.createdAt,
					updatedAt: apikey.updatedAt,
					permissions: apikey.permissions,
					metadata: apikey.metadata,
				})
				.from(apikey)
				.where(eq(apikey.userId, ctx.user.id));

			// Parse permissions from JSON string if needed
			return keys.map((key) => ({
				...key,
				permissions: key.permissions
					? typeof key.permissions === "string"
						? JSON.parse(key.permissions)
						: key.permissions
					: null,
			}));
		}),

	create: protectedProcedure
		.meta({ team: false })
		.input(createApiKeySchema)
		.mutation(async ({ ctx, input }) => {
			// Use Better Auth's API key creation
			// @ts-expect-error unknown missing createApiKey method
			const result = await auth.api.createApiKey({
				body: {
					name: input.name,
					expiresIn: input.expiresIn,
					permissions: input.permissions,
					userId: ctx.user.id,
					metadata: {
						teamId: ctx.user.teamId,
					},
				},
			});

			if (!result || !result.key) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create API key",
				});
			}

			return {
				id: result.id,
				key: result.key, // The raw key - only shown once
				name: input.name,
			};
		}),

	delete: protectedProcedure
		.meta({ team: false })
		.input(deleteApiKeySchema)
		.mutation(async ({ ctx, input }) => {
			// Verify the key belongs to the user
			const existingKey = await db
				.select({ id: apikey.id, userId: apikey.userId })
				.from(apikey)
				.where(and(eq(apikey.id, input.id), eq(apikey.userId, ctx.user.id)))
				.limit(1);

			if (!existingKey.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "API key not found",
				});
			}

			// Delete the key
			await db
				.delete(apikey)
				.where(and(eq(apikey.id, input.id), eq(apikey.userId, ctx.user.id)));

			return { success: true };
		}),
});
