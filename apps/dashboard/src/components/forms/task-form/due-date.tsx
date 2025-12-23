import { Button } from "@ui/components/ui/button";
import { Calendar } from "@ui/components/ui/calendar";
import {
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@ui/components/ui/form";
import { Input } from "@ui/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/ui/popover";
import { format, formatRelative } from "date-fns";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";

export const DueDate = () => {
	const form = useFormContext();

	return (
		<FormField
			name="dueDate"
			control={form.control}
			render={({ field }) => (
				<FormItem>
					<FormControl>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="secondary"
									className="h-6 w-fit justify-between font-normal text-xs"
								>
									<CalendarIcon className="text-muted-foreground" />
									{field.value ? (
										formatRelative(field.value, new Date())
									) : (
										<span className="text-muted-foreground">Due date</span>
									)}
									<ChevronDownIcon className="text-muted-foreground" />
								</Button>
							</PopoverTrigger>
							<PopoverContent
								className="w-auto overflow-hidden p-0"
								align="start"
							>
								<Calendar
									mode="single"
									selected={field.value ? new Date(field.value) : undefined}
									captionLayout="dropdown"
									onSelect={(date) => {
										field.onChange(date?.toISOString());
									}}
								/>
								<Input
									type="time"
									value={
										field.value ? format(new Date(field.value), "HH:mm") : ""
									}
									onChange={(e) => {
										if (field.value) {
											const date = new Date(field.value);

											const [hours, minutes] = e.target.value
												.split(":")
												.map(Number);
											if (hours === undefined || minutes === undefined) {
												return;
											}

											date.setHours(hours, minutes);
											field.onChange(date.toISOString());
										}
									}}
									placeholder="Set time"
									className="rounded-t-none border-t-0"
								/>
							</PopoverContent>
						</Popover>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};
