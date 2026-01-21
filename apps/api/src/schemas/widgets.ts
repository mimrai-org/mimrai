import z from "zod";

export const getWidgetSchema = z.object({
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
});
