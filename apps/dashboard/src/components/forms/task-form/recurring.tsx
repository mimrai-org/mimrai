import { Button } from "@ui/components/ui/button";
import { Calendar } from "@ui/components/ui/calendar";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/ui/form";
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
import { formatRelative } from "date-fns";
import { CalendarSyncIcon, ChevronDownIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { TaskFormValues } from "./form";

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

export const Recurring = () => {
	const form = useFormContext<TaskFormValues>();
	const recurring = form.watch("recurring");

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
			<PopoverContent className="w-82 overflow-hidden p-0" align="start">
				<div className="flex flex-col">
					<div className="order-1 flex space-x-4 p-4">
						<FormField
							name="recurring.frequency"
							control={form.control}
							render={({ field }) => (
								<FormItem className="w-full">
									<FormControl>
										<Select value={field.value} onValueChange={field.onChange}>
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
							name="recurring.interval"
							control={form.control}
							render={({ field }) => (
								<FormItem className="w-full">
									<FormControl>
										<Select
											value={field.value?.toString()}
											onValueChange={field.onChange}
										>
											<SelectTrigger size="sm" className="w-full">
												<SelectValue placeholder="Every..." />
											</SelectTrigger>
											<SelectContent>
												{new Array(12).fill(null).map((_, index) => (
													<SelectItem
														key={index + 1}
														value={(index + 1).toString()}
													>
														{formatInterval(
															index + 1,
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
					</div>
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
								form.setValue("recurring.startDate", date?.toISOString(), {
									shouldDirty: true,
									shouldValidate: true,
								});
							}}
						/>
					</div>
				</div>
			</PopoverContent>
		</Popover>
		// 			</FormControl>
		// 			<FormMessage />
		// 		</FormItem>
		// 	)}
		// />
	);
};
