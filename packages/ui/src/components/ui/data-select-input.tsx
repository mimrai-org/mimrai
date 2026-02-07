import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { cn } from "@ui/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import { type ComponentProps, useMemo, useState } from "react";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Command, CommandGroup, CommandInput, CommandItem } from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export const DataSelectInput = <
	D,
	TFn,
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
	renderValue,
	renderClear,
	before,
	clearable,
	className,
	showChevron = true,
	multiple,
	renderMultiple = (items) => (
		<div className="flex gap-1">
			{items.map((item) => (
				<span
					key={getValue(item)}
					className="inline-flex items-center rounded-xs bg-primary px-2 py-1 font-medium text-primary text-primary-foreground text-xs"
				>
					{getLabel(item)}
				</span>
			))}
		</div>
	),
	...buttonProps
}: {
	placeholder?: string;
	queryOptions: UseQueryOptions<TFn, TError, T, TQueryKey>;
	value: V;
	before?: React.ReactNode;
	onChange: (value: V) => void;
	getValue: (item: T[number]) => string;
	getLabel: (item?: T[number]) => string;
	renderClear?: () => React.ReactNode;
	clearable?: boolean;
	renderItem?: (item: T[number]) => React.ReactNode;
	renderValue?: (item: T[number]) => React.ReactNode;
	renderMultiple?: (items: T[number][]) => React.ReactNode;
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
						"w-full justify-between truncate text-left",
						!value && "text-muted-foreground",
						className,
					)}
					{...buttonProps}
				>
					<div className="flex items-center gap-2">
						{before}
						{Array.isArray(value) && value.length > 0 ? (
							renderMultiple ? (
								renderMultiple(multipleValues)
							) : (
								"Render multiple not implemented"
							)
						) : singleValue ? (
							(renderValue?.(singleValue) ??
							renderItem?.(singleValue) ??
							getLabel(singleValue))
						) : (
							<span className="font-normal text-muted-foreground">
								{placeholder ?? "Select..."}
							</span>
						)}
					</div>

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
						{clearable && (
							<CommandItem
								onSelect={() => {
									if (multiple) onChange([] as string[] as V);
									else onChange(null as V);
									setOpen(false);
								}}
								className="text-muted-foreground"
							>
								{renderClear ? renderClear() : "Clear selection"}
							</CommandItem>
						)}
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
