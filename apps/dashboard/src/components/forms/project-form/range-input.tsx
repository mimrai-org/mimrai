import { Button } from "@ui/components/ui/button";
import { Calendar } from "@ui/components/ui/calendar";
import { FormField } from "@ui/components/ui/form";
import { Input } from "@ui/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/ui/popover";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@ui/components/ui/tooltip";
import { set } from "better-auth";
import { format, isValid, parse } from "date-fns";
import { CalendarClockIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { ProjectFormValues } from "./form-type";

/**
 * Parse a string value into a date following these rules:
 * - Locale Date format: MM/DD/YYYY
 * - Month and day: Dec 11 or 11 Dec
 * - Quarter: Q1 2025 (returns first day of quarter)
 * - Half Year: H1 2025 (returns first day of half year)
 * - Year: 2025 (returns Jan 1 of that year)
 */
function parseDateString(value: string): Date | null {
	const trimmed = value.trim();
	if (!trimmed) return null;

	const currentYear = new Date().getFullYear();

	// Try MM/DD/YYYY format
	const slashDate = parse(trimmed, "MM/dd/yyyy", new Date());
	if (isValid(slashDate)) return slashDate;

	// Try M/D/YYYY format (single digit month/day)
	const slashDateShort = parse(trimmed, "M/d/yyyy", new Date());
	if (isValid(slashDateShort)) return slashDateShort;

	// Try "Dec 11" or "Dec 11, 2025" format
	const monthDayMatch = trimmed.match(
		/^([A-Za-z]{3,9})\s+(\d{1,2})(?:,?\s*(\d{4}))?$/,
	);
	if (monthDayMatch) {
		const [, month, day, year] = monthDayMatch;
		const dateStr = `${month} ${day}, ${year || currentYear}`;
		const parsed = parse(dateStr, "MMM d, yyyy", new Date());
		if (isValid(parsed)) return parsed;
		// Try full month name
		const parsedFull = parse(dateStr, "MMMM d, yyyy", new Date());
		if (isValid(parsedFull)) return parsedFull;
	}

	// Try "11 Dec" or "11 Dec 2025" format
	const dayMonthMatch = trimmed.match(
		/^(\d{1,2})\s+([A-Za-z]{3,9})(?:,?\s*(\d{4}))?$/,
	);
	if (dayMonthMatch) {
		const [, day, month, year] = dayMonthMatch;
		const dateStr = `${month} ${day}, ${year || currentYear}`;
		const parsed = parse(dateStr, "MMM d, yyyy", new Date());
		if (isValid(parsed)) return parsed;
		// Try full month name
		const parsedFull = parse(dateStr, "MMMM d, yyyy", new Date());
		if (isValid(parsedFull)) return parsedFull;
	}

	// Try Quarter format: Q1 2025, Q2 2025, etc.
	const quarterMatch = trimmed.match(/^Q([1-4])\s*(\d{4})$/i);
	if (quarterMatch?.[1] && quarterMatch[2]) {
		const quarterNum = Number.parseInt(quarterMatch[1], 10);
		const yearNum = Number.parseInt(quarterMatch[2], 10);
		const month = (quarterNum - 1) * 3; // Q1=0, Q2=3, Q3=6, Q4=9
		return new Date(yearNum, month, 1);
	}

	// Try Half Year format: H1 2025, H2 2025
	const halfMatch = trimmed.match(/^H([1-2])\s*(\d{4})$/i);
	if (halfMatch?.[1] && halfMatch[2]) {
		const halfNum = Number.parseInt(halfMatch[1], 10);
		const yearNum = Number.parseInt(halfMatch[2], 10);
		const month = halfNum === 1 ? 0 : 6; // H1=January, H2=July
		return new Date(yearNum, month, 1);
	}

	// Try Year only: 2025
	const yearMatch = trimmed.match(/^(\d{4})$/);
	if (yearMatch?.[1]) {
		const yearNum = Number.parseInt(yearMatch[1], 10);
		if (yearNum >= 1900 && yearNum <= 2100) {
			return new Date(yearNum, 0, 1);
		}
	}

	return null;
}

export const RangeInput = () => {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className="flex h-7 items-center gap-2 rounded-sm border bg-background px-2">
					<CalendarClockIcon className="size-3.5" />
					<ProjectDateSelect name="startDate" placeholder="Start" />
					<span className="text-muted-foreground text-sm">to</span>
					<ProjectDateSelect name="endDate" placeholder="End" />
				</div>
			</TooltipTrigger>
			<TooltipContent>
				Set the start and end dates for the project.
			</TooltipContent>
		</Tooltip>
	);
};

export const ProjectDateSelect = ({
	name,
	placeholder,
}: {
	name: keyof ProjectFormValues;
	placeholder?: string;
}) => {
	const form = useFormContext<ProjectFormValues>();
	const [inputValue, setInputValue] = useState("");
	const [calendarVersion, setCalendarVersion] = useState(0);

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		onChange: (value: string | null) => void,
	) => {
		const value = e.target.value;
		setInputValue(value);

		// Try to parse the date
		const parsed = parseDateString(value);
		if (parsed) {
			onChange(parsed.toISOString());
			setCalendarVersion((v) => v + 1);
		}
	};

	return (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<Popover>
					<PopoverTrigger asChild>
						<button type="button" className="text-xs">
							{field.value ? (
								format(
									field.value ? new Date(field.value as string) : new Date(),
									"MMM d",
								)
							) : (
								<span className="text-muted-foreground">
									{placeholder || "Select date"}
								</span>
							)}
						</button>
					</PopoverTrigger>
					<PopoverContent>
						<div className="relative flex items-center gap-2">
							<Input
								value={inputValue}
								placeholder={"e.g., Dec 15, Q1 2025, 2025"}
								onChange={(e) => handleInputChange(e, field.onChange)}
								className="pr-8"
							/>
							<Button
								variant={"ghost"}
								className="-translate-y-1/2 absolute top-1/2 right-2 size-6 p-0"
								onClick={() => {
									field.onChange(null);
									setInputValue("");
								}}
							>
								<XIcon />
							</Button>
						</div>
						<Calendar
							key={calendarVersion}
							mode="single"
							today={field.value ? new Date(field.value as string) : new Date()}
							selected={
								field.value ? new Date(field.value as string) : undefined
							}
							onSelect={(date) => {
								field.onChange(date ? date.toISOString() : null);
								setInputValue(date ? format(date, "MMM d, yyyy") : "");
							}}
							className="w-full"
						/>
					</PopoverContent>
				</Popover>
			)}
		/>
	);
};
