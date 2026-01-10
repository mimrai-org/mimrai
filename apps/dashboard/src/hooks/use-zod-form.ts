import { zodResolver } from "@hookform/resolvers/zod";
import { type UseFormProps, useForm } from "react-hook-form";
import type { z } from "zod";

export const useZodForm = <T extends z.ZodType<any, any>>(
	schema: T,
	options?: Omit<UseFormProps<z.infer<T>>, "resolver">,
) => {
	return useForm<z.infer<T>, any, z.infer<T>>({
		// @ts-expect-error
		resolver: zodResolver(schema),
		...options,
	});
};
