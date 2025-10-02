import z from "zod";
import { paginationSchema } from "./base";

export const getUsersSchema = z.object({
	...paginationSchema.shape,
	search: z.string().optional(),
	teamId: z.string().optional(),
});
export type GetUsersInput = z.infer<typeof getUsersSchema>;

export const switchTeamSchema = z.object({
	teamId: z.string(),
});
