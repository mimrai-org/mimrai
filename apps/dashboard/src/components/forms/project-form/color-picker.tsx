import {
	ColorPicker,
	ColorPickerArea,
	ColorPickerHueSlider,
	Swatch,
} from "@ui/components/ui/color-picker";
import { FormControl, FormField, FormItem } from "@ui/components/ui/form";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/ui/popover";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { ProjectIcon } from "@/components/project-icon";
import type { ProjectFormValues } from "./form-type";

const presetColors = [
	"#d4a373",
	"#e07a5f",
	"#4852ad",
	"#81b29a",
	"#f2cc8f",
	"#6a994e",
];

export const ProjectColorPicker = ({
	children,
}: {
	children?: React.ReactNode;
}) => {
	const [showPicker, setShowPicker] = useState(false);
	const form = useFormContext<ProjectFormValues>();

	return (
		<FormField
			control={form.control}
			name="color"
			render={({ field }) => (
				<FormItem>
					<Popover>
						<PopoverTrigger className="w-fit">
							<FormControl>
								<ProjectIcon className="size-6" color={field.value} />
							</FormControl>
						</PopoverTrigger>
						<PopoverContent side="bottom" align="start" className="w-78">
							<ColorPicker
								value={field.value || ""}
								onValueChange={(v) => field.onChange(v)}
								format="hex"
							>
								<div className="flex items-center gap-2">
									<div className="flex w-full">
										{presetColors.map((color) => (
											<button
												key={color}
												type="button"
												className="mx-auto aspect-square size-6 rounded-xs"
												style={{ backgroundColor: color }}
												onClick={() => field.onChange(color)}
											/>
										))}
									</div>
									<div className="flex items-center border-l">
										<button
											type="button"
											onClick={() => setShowPicker(!showPicker)}
											className="ml-2 aspect-square size-6 rounded-xs"
											style={{
												background:
													"conic-gradient(rgb(235, 87, 87), rgb(242, 201, 76), rgb(76, 183, 130), rgb(78, 167, 252), rgb(250, 96, 122))",
											}}
										/>
									</div>
								</div>
								{showPicker && (
									<div className="pt-4">
										<ColorPickerArea />
										<ColorPickerHueSlider className="mt-2" />
									</div>
								)}
							</ColorPicker>
						</PopoverContent>
					</Popover>
				</FormItem>
			)}
		/>
	);
};
