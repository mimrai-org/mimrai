import { FormControl, FormField, FormItem } from "@ui/components/ui/form";
import { useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export const Labels = () => {
	const form = useFormContext();

	return (
		<FormField
			control={form.control}
			name="labels"
			render={({ field }) => (
				<FormItem>
					<FormControl>
						<LabelInput
							className="w-fit justify-start px-0 text-xs"
							placeholder="Add labels..."
							value={field.value ?? []}
							onChange={(value) => field.onChange(value)}
						/>
					</FormControl>
				</FormItem>
			)}
		/>
	);
};
