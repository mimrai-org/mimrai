import {
	cronToRecurrenceEditor,
	recurrenceEditorToCron,
} from "@mimir/utils/recurrence";
import { PopoverClose } from "@radix-ui/react-popover";
import { Button } from "@ui/components/ui/button";
import { Calendar } from "@ui/components/ui/calendar";
import { FormControl, FormField, FormItem } from "@ui/components/ui/form";
import { Input } from "@ui/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/ui/select";
import { format, formatRelative } from "date-fns";
import { CalendarSyncIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { TaskFormValues } from "./form-type";

const formatFrequency = (frequency: string) => {
	if (frequency === "daily") {
		return "day";
	}
	if (frequency === "weekly") {
		return "week";
	}
	if (frequency === "monthly") {
		return "month";
	}
	if (frequency === "yearly") {
		return "year";
	}
	return frequency;
};

const formatInterval = (interval: number, frequency: string) => {
	const formattedFrequency = formatFrequency(frequency);

	if (interval === 1) {
		return `Every ${interval} ${formattedFrequency}`;
	}

	return `Every ${interval} ${formattedFrequency}s`;
};

const getDefaultRecurrence = () => ({
	frequency: "daily" as const,
	interval: 1,
	startDate: new Date().toISOString(),
});

const getIntervalOptions = (frequency: string) => {
	if (frequency === "weekly" || frequency === "yearly") {
		return [1];
	}

	return new Array(12).fill(null).map((_, index) => index + 1);
};

export const Recurring = () => {
	const form = useFormContext<TaskFormValues>();
	const recurringCron = form.watch("recurring");
	const recurring = recurringCron
		? cronToRecurrenceEditor(recurringCron)
		: null;

	const setRecurring = (
		nextValue: Partial<NonNullable<typeof recurring>>,
		{ shouldValidate = false }: { shouldValidate?: boolean } = {},
	) => {
		const currentValue = recurring ?? getDefaultRecurrence();
		const frequency = nextValue.frequency ?? currentValue.frequency;
		const normalizedInterval =
			frequency === "weekly" || frequency === "yearly"
				? 1
				: Number(nextValue.interval ?? currentValue.interval);

		const cronExpression = recurrenceEditorToCron({
			frequency,
			interval: normalizedInterval,
			startDate: nextValue.startDate ?? currentValue.startDate,
		});

		form.setValue("recurring", cronExpression, {
			shouldDirty: true,
			shouldValidate,
		});
	};

	const recurrenceDate = recurring?.startDate
		? new Date(recurring.startDate)
		: new Date();

	const timeValue = format(recurrenceDate, "HH:mm");

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant={
						form.formState.errors.recurring ? "destructive" : "secondary"
					}
					className="h-6 w-fit justify-between font-normal text-xs"
				>
					<CalendarSyncIcon className="size-3.5 text-muted-foreground" />
					{recurring?.startDate && recurring.frequency && recurring.interval ? (
						<div className="flex gap-1">
							<div className="space-x-1">
								<span className="text-muted-foreground">Starting at</span>
								<span>{formatRelative(recurring.startDate, new Date())}</span>
							</div>
							<div className="space-x-1">
								<span className="text-muted-foreground">Repeats</span>
								<span>
									{formatInterval(recurring.interval || 1, recurring.frequency)}
								</span>
							</div>
						</div>
					) : (
						<span className="text-muted-foreground">Make recurring</span>
					)}
					<ChevronDownIcon className="text-muted-foreground" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="overflow-hidden p-0" align="start">
				<div className="flex flex-col">
					<div className="w-auto">
						<Calendar
							className="w-full"
							mode="single"
							selected={
								recurring?.startDate
									? new Date(recurring?.startDate)
									: new Date()
							}
							captionLayout="dropdown"
							onSelect={(date) => {
								setRecurring(
									{
										startDate: date?.toISOString(),
									},
									{ shouldValidate: true },
								);
							}}
						/>
					</div>
					<div className="flex flex-col space-y-2 px-4 pb-4">
						<FormField
							name="recurring"
							control={form.control}
							render={() => (
								<FormItem className="w-full">
									<FormControl>
										<Select
											value={recurring?.frequency}
											onValueChange={(value) => {
												setRecurring(
													{
														frequency: value as
															| "daily"
															| "weekly"
															| "monthly"
															| "yearly",
													},
													{ shouldValidate: true },
												);
											}}
										>
											<SelectTrigger size="sm" className="w-full">
												<SelectValue placeholder="Repeat..." />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="daily">Daily</SelectItem>
												<SelectItem value="weekly">Weekly</SelectItem>
												<SelectItem value="monthly">Monthly</SelectItem>
												<SelectItem value="yearly">Yearly</SelectItem>
											</SelectContent>
										</Select>
									</FormControl>
								</FormItem>
							)}
						/>

						<FormField
							name="recurring"
							control={form.control}
							render={() => (
								<FormItem className="w-full">
									<FormControl>
										<Select
											value={String(recurring?.interval ?? 1)}
											onValueChange={(value) => {
												setRecurring(
													{
														interval: Number(value),
													},
													{ shouldValidate: true },
												);
											}}
										>
											<SelectTrigger size="sm" className="w-full">
												<SelectValue placeholder="Every..." />
											</SelectTrigger>
											<SelectContent>
												{getIntervalOptions(
													recurring?.frequency || "daily",
												).map((option) => (
													<SelectItem key={option} value={option.toString()}>
														{formatInterval(
															option,
															recurring?.frequency || "daily",
														)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormControl>
								</FormItem>
							)}
						/>

						<Input
							type="time"
							value={timeValue}
							onChange={(event) => {
								const [hours, minutes] = event.target.value
									.split(":")
									.map(Number);
								if (hours === undefined || minutes === undefined) {
									return;
								}

								const nextDate = new Date(recurrenceDate);
								nextDate.setHours(hours, minutes);

								setRecurring(
									{
										startDate: nextDate.toISOString(),
									},
									{ shouldValidate: true },
								);
							}}
							placeholder="Set time"
							className="border-0"
						/>

						{recurringCron && (
							<PopoverClose asChild>
								<Button
									variant="destructive"
									size="sm"
									className="w-full text-xs"
									onClick={() => {
										form.setValue("recurring", null, {
											shouldDirty: true,
											shouldValidate: true,
										});
									}}
								>
									<XIcon />
									Remove Recurrence
								</Button>
							</PopoverClose>
						)}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
};
