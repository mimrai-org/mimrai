import z from "zod";
import { paginationSchema } from "./base";

export const getUsersSchema = z.object({
	...paginationSchema.shape,
	search: z.string().optional(),
	teamId: z.string().optional(),
});
export type GetUsersInput = z.infer<typeof getUsersSchema>;

export const switchTeamSchema = z
	.object({
		slug: z.string(),
	})
	.or(
		z.object({
			teamId: z.string(),
		}),
	);

export const updateUserProfileSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters long").optional(),
	lastZenModeAt: z.coerce.date().optional().nullable(),
	locale: z.string().optional(),
	image: z.url().optional().nullable(),
});
