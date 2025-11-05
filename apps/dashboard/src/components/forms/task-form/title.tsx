import {
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@ui/components/ui/form";
import { Input } from "@ui/components/ui/input";
import { useFormContext } from "react-hook-form";

export const Title = () => {
	const form = useFormContext();

	return (
		<FormField
			control={form.control}
			name="title"
			render={({ field }) => (
				<FormItem className="flex-1">
					<FormControl>
						<Input
							variant={"ghost"}
							className="h-10 w-full px-0 font-medium hover:bg-transparent focus:border-0 md:text-xl dark:hover:bg-transparent"
							placeholder="Task title"
							autoFocus={false}
							{...field}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};
