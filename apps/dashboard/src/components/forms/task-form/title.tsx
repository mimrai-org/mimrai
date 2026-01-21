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
							className="h-12 w-full resize-none break-words border-0 bg-transparent px-0 font-medium hover:bg-transparent focus:border-0 focus:outline-none focus-visible:ring-0 md:text-2xl dark:bg-transparent dark:hover:bg-transparent"
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
