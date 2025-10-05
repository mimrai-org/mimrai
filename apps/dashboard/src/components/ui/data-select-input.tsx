import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { ChevronDownIcon } from "lucide-react";
import { type ComponentProps, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Command, CommandGroup, CommandInput, CommandItem } from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export const DataSelectInput = <
	D,
	T extends Array<D>,
	TError,
	TQueryKey extends readonly unknown[],
	V extends string | string[] | null | undefined,
>({
	queryOptions,
	value,
	placeholder,
	onChange,
	getValue,
	getLabel,
	renderItem,
	className,
	showChevron = true,
	multiple,
	renderMultiple = (items) => (
		<div className="flex gap-1">
			{items.map((item) => (
				<span
					key={getValue(item)}
					className="inline-flex items-center rounded-full bg-primary px-2 py-1 font-medium text-primary text-primary-foreground text-xs"
				>
					{getLabel(item)}
				</span>
			))}
		</div>
	),
	...buttonProps
}: {
	placeholder?: string;
	queryOptions: UseQueryOptions<T, TError, T, TQueryKey>;
	value: V;
	onChange: (value: V) => void;
	getValue: (item: T[number]) => string;
	getLabel: (item?: T[number]) => string;
	renderItem?: (item: T[number]) => React.ReactNode;
	renderMultiple?: (items: D[]) => React.ReactNode;
	showChevron?: boolean;
	multiple?: boolean;
} & Omit<ComponentProps<typeof Button>, "value" | "onChange">) => {
	const [open, setOpen] = useState(false);
	const { data } = useQuery(queryOptions);

	const singleValue = useMemo(() => {
		if (!value) return null;
		return data?.find((item) => getValue(item) === value);
	}, [data, value, getValue]);

	const multipleValues = useMemo(() => {
		if (!value || !Array.isArray(value)) return [];
		return data?.filter((item) => value.includes(getValue(item))) || [];
	}, [data, value, getValue]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					className={cn(
						"w-full justify-between truncate rounded-xs text-left",
						!value && "text-muted-foreground",
						className,
					)}
					{...buttonProps}
				>
					{Array.isArray(value) && value.length > 0 ? (
						renderMultiple ? (
							renderMultiple(multipleValues)
						) : (
							"Render multiple not implemented"
						)
					) : singleValue ? (
						(renderItem?.(singleValue) ?? getLabel(singleValue))
					) : (
						<span className="font-normal text-muted-foreground">
							{placeholder ?? "Select..."}
						</span>
					)}

					{showChevron ? (
						<ChevronDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
					) : (
						<div />
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent>
				<Command>
					<CommandInput placeholder="Type to filter..." />
					<CommandGroup>
						{data?.map((item: D) => (
							<CommandItem
								key={getValue(item)?.toString()}
								onSelect={() => {
									const newValue = getValue(item);

									if (!multiple) {
										onChange(newValue as V);
										setOpen(false);
										return;
									}

									if (Array.isArray(value)) {
										if (value.includes(newValue)) {
											onChange(value.filter((v) => v !== newValue) as V);
										} else {
											onChange([...value, newValue] as V);
										}
									} else {
										onChange([newValue] as V);
									}
								}}
							>
								{multiple && (
									<Checkbox
										checked={
											Array.isArray(value) && value.includes(getValue(item))
										}
										className="mr-2"
									/>
								)}
								{renderItem ? renderItem(item) : getLabel(item)}
							</CommandItem>
						))}
					</CommandGroup>
				</Command>
			</PopoverContent>
		</Popover>
	);
};
