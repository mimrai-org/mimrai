import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import {
	type UseFormProps,
	type UseFormReturn,
	useForm,
	useWatch,
} from "react-hook-form";
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

export const useFormAutoSave = <S, T extends UseFormReturn<S>>(
	form: T,
	submitHandler: (data: S) => void,
	options?: {
		enabled?: boolean;
	},
) => {
	const { enabled = true } = options || {};
	const values = useWatch({
		control: form.control,
		compute: (data) => data,
	});
	const latestValues = useRef(values);
	const saveTimeout = useRef<NodeJS.Timeout | null>(null);
	useEffect(() => {
		if (!enabled) return;
		if (JSON.stringify(latestValues.current) === JSON.stringify(values)) {
			return;
		}
		if (saveTimeout.current) {
			clearTimeout(saveTimeout.current);
		}
		saveTimeout.current = setTimeout(() => {
			submitHandler(values);
		}, 1000);
		latestValues.current = values;
		return () => clearTimeout(saveTimeout.current);
	}, [values, enabled]);
};
