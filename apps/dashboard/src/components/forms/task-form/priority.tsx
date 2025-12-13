import {
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@ui/components/ui/form";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
} from "@ui/components/ui/select";
import { useFormContext } from "react-hook-form";
import { Priority as PriorityItem } from "@/components/tasks-view/properties/priority";

export const Priority = () => {
	const form = useFormContext();

	return (
		<FormField
			name="priority"
			control={form.control}
			render={({ field }) => (
				<FormItem>
					<FormControl>
						<Select
							value={field.value ?? undefined}
							onValueChange={field.onChange}
						>
							<SelectTrigger className="h-6! bg-secondary text-xs hover:bg-secondary/80 dark:bg-secondary dark:hover:bg-secondary/80">
								{field.value && (
									<div className="flex items-center gap-2 capitalize">
										<PriorityItem value={field.value} />
										{field.value}
									</div>
								)}
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="low">Low</SelectItem>
									<SelectItem value="medium">Medium</SelectItem>
									<SelectItem value="high">High</SelectItem>
									<SelectItem value="urgent">Urgent</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};
