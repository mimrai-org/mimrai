import z from "zod";

export const createCheckoutSchema = z.object({
	productId: z.string(),
	recurringInterval: z.enum(["month", "year"]),
});
