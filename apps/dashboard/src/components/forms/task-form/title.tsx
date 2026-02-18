"use client";
import {
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@ui/components/ui/form";
import { useMemo, useRef } from "react";
import { useFormContext } from "react-hook-form";

export const Title = () => {
	const form = useFormContext();
	const initialValue = useRef(form.getValues("title"));

	return (
		<FormField
			control={form.control}
			name="title"
			render={({ field }) => (
				<FormItem className="flex-1">
					<FormControl>
						<div className="relative">
							<div
								className="font-medium focus-visible:outline-none focus-visible:ring-0 md:text-3xl"
								onBlur={(e) => {
									field.onBlur();
									// field.onChange(e.target.textContent || "");
								}}
								onInput={(e) => {
									field.onChange(e.currentTarget.textContent || "");
								}}
								role="textbox"
								tabIndex={0}
								contentEditable
								suppressContentEditableWarning
							>
								{initialValue.current}
							</div>
							{!field.value && (
								<span className="pointer-events-none absolute top-0 left-0 text-muted-foreground sm:text-2xl">
									Title
								</span>
							)}
						</div>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};
