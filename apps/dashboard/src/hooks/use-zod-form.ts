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

const filterIgnoredFields = <S extends Record<string, any>>(
	data: S,
	ignoreFields: (keyof S)[] = [],
): Partial<S> => {
	if (ignoreFields.length === 0) return data;
	const filtered = { ...data };
	ignoreFields.forEach((field) => {
		delete filtered[field];
	});
	return filtered;
};

const shallowEqual = <T extends Record<string, any>>(
	obj1: T,
	obj2: T,
): boolean => {
	const keys1 = Object.keys(obj1);
	const keys2 = Object.keys(obj2);
	if (keys1.length !== keys2.length) return false;
	return keys1.every((key) => obj1[key] === obj2[key]);
};

export const useFormAutoSave = <S, T extends UseFormReturn<S>>(
	form: T,
	submitHandler: (data: S) => void,
	options?: {
		enabled?: boolean;
		ignoreFields?: (keyof S)[];
	},
) => {
	const { enabled = true, ignoreFields = [] } = options || {};
	const values = useWatch({
		control: form.control,
		compute: (data) => data,
	});
	const latestValues = useRef(values);
	const saveTimeout = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		if (!enabled) return;

		const filteredValues = filterIgnoredFields(values, ignoreFields);
		const filteredLatestValues = filterIgnoredFields(
			latestValues.current,
			ignoreFields,
		);

		if (shallowEqual(filteredLatestValues, filteredValues)) {
			return;
		}

		if (saveTimeout.current) {
			clearTimeout(saveTimeout.current);
		}

		saveTimeout.current = setTimeout(() => {
			submitHandler(values);
		}, 1000);

		latestValues.current = values;

		return () => {
			if (saveTimeout.current) clearTimeout(saveTimeout.current);
		};
	}, [values, enabled, ignoreFields]);
};
