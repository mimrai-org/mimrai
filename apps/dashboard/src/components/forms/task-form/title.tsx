"use client";
import {
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@ui/components/ui/form";
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
						<div
							className="font-medium focus-visible:outline-none focus-visible:ring-0 sm:text-2xl"
							onBlur={(e) => {
								field.onBlur();
								field.onChange(e.target.textContent || "");
							}}
							contentEditable
							suppressContentEditableWarning
						>
							{field.value}
						</div>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};
