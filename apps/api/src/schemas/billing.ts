import z from "zod";

export const createCheckoutSchema = z.object({
	planSlug: z.string(),
	recurringInterval: z.enum(["monthly", "yearly"]),
});
