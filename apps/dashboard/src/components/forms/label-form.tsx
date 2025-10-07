"use client";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useLabelParams } from "@/hooks/use-task-label-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { queryClient, trpc } from "@/utils/trpc";
import { Button } from "../ui/button";
import {
	ColorPicker,
	ColorPickerAlphaSlider,
	ColorPickerArea,
	ColorPickerContent,
	ColorPickerEyeDropper,
	ColorPickerHueSlider,
	ColorPickerInput,
	ColorPickerSwatch,
	ColorPickerTrigger,
} from "../ui/color-picker";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

const schema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Name is required"),
	color: z.string().min(1, "Color is required"),
	description: z.string().optional(),
});

export const LabelForm = ({
	defaultValues,
}: {
	defaultValues?: Partial<z.infer<typeof schema>>;
}) => {
	const { setParams } = useLabelParams();
	const form = useZodForm(schema, {
		defaultValues: {
			name: "",
			color: "",
			description: "",
			...defaultValues,
		},
	});

	const { mutate: createLabel } = useMutation(
		trpc.labels.create.mutationOptions({
			onSuccess: (taskLabel) => {
				queryClient.invalidateQueries(trpc.labels.get.queryOptions({}));
				queryClient.setQueryData(
					trpc.labels.getById.queryKey({ id: taskLabel.id }),
					taskLabel,
				);
				setParams(null);
			},
		}),
	);

	const { mutate: updateLabel } = useMutation(
		trpc.labels.update.mutationOptions({
			onSuccess: (taskLabel) => {
				queryClient.invalidateQueries(trpc.labels.get.queryOptions({}));
				queryClient.setQueryData(
					trpc.labels.getById.queryKey({ id: taskLabel.id }),
					taskLabel,
				);
				setParams(null);
			},
		}),
	);

	const handleSubmit = (data: z.infer<typeof schema>) => {
		if (data.id) {
			// update
			updateLabel({
				id: data.id,
				...data,
			});
		} else {
			// create
			createLabel({
				...data,
			});
		}
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleSubmit)}
				className="space-y-4 px-4"
			>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input placeholder="Name" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description</FormLabel>
							<FormControl>
								<Textarea placeholder="Description" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="color"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Color</FormLabel>
							<FormControl>
								<ColorPicker
									value={field.value}
									onValueChange={field.onChange}
									format="hex"
								>
									<ColorPickerTrigger asChild>
										<Button
											variant="outline"
											className="flex items-center gap-2 px-3"
										>
											<ColorPickerSwatch className="size-4" />
											{field.value}
										</Button>
									</ColorPickerTrigger>

									<ColorPickerContent>
										<ColorPickerArea />
										<div className="flex items-center gap-2">
											<ColorPickerEyeDropper />
											<div className="flex flex-1 flex-col gap-2">
												<ColorPickerHueSlider />
											</div>
										</div>
										<div>
											<ColorPickerInput />
										</div>
									</ColorPickerContent>
								</ColorPicker>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end pt-2">
					<Button type="submit" disabled={form.formState.isSubmitting}>
						Save
					</Button>
				</div>
			</form>
		</Form>
	);
};
