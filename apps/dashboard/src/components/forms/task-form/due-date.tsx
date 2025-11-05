import { Button } from "@ui/components/ui/button";
import { Calendar } from "@ui/components/ui/calendar";
import {
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@ui/components/ui/form";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/ui/popover";
import { formatRelative } from "date-fns";
import { ChevronDownIcon } from "lucide-react";
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
							</PopoverContent>
						</Popover>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};
