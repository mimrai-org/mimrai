"use client";

import { Button } from "@mimir/ui/button";
import {
	ColorPicker,
	ColorPickerArea,
	ColorPickerHueSlider,
} from "@mimir/ui/color-picker";
import { Form, FormControl, FormField, FormItem } from "@mimir/ui/form";
import { Input } from "@mimir/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@mimir/ui/popover";
import { PopoverClose } from "@radix-ui/react-popover";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar } from "@ui/components/ui/calendar";
import { format } from "date-fns";
import {
	CalendarClockIcon,
	Loader2,
	PlusIcon,
	SaveIcon,
	XIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod/v3";
import { useMilestoneParams } from "@/hooks/use-milestone-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/utils/trpc";
import { MilestoneIcon } from "../milestone-icon";

const schema = z.object({
	id: z.string().optional(),
	name: z.string().min(1).max(255),
	description: z.string().max(5000).optional().nullable(),
	dueDate: z.string().optional().nullable(),
	color: z.string().optional().nullable(),
	projectId: z.string(),
});

const presetColors = [
	"#f4f1de",
	"#e07a5f",
	"#4852ad",
	"#81b29a",
	"#f2cc8f",
	"#6a994e",
];

export const MilestoneForm = ({
	defaultValues,
	projectId,
}: {
	defaultValues?: Partial<z.infer<typeof schema>>;
	projectId: string;
}) => {
	const [showPicker, setShowPicker] = useState(false);
	const { setParams } = useMilestoneParams();
	const queryClient = useQueryClient();
	const form = useZodForm(schema, {
		defaultValues: {
			name: "",
			description: "",
			dueDate: null,
			color: "#b1b1b1",
			projectId,
			...defaultValues,
		},
	});

	const { mutate: createMilestone, isPending: isCreating } = useMutation(
		trpc.milestones.create.mutationOptions({
			onMutate: async () => {
				toast.loading("Creating milestone...", { id: "create-milestone" });
			},
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.milestones.get.infiniteQueryOptions(),
				);
				toast.success("Milestone created successfully", {
					id: "create-milestone",
				});
				setParams(null);
			},
			onError: (error) => {
				toast.error(`Error creating milestone: ${error.message}`, {
					id: "create-milestone",
				});
			},
		}),
	);

	const { mutate: updateMilestone, isPending: isUpdating } = useMutation(
		trpc.milestones.update.mutationOptions({
			onMutate: async () => {
				toast.loading("Updating milestone...", { id: "update-milestone" });
			},
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.milestones.get.infiniteQueryOptions(),
				);
				toast.success("Milestone updated successfully", {
					id: "update-milestone",
				});
				setParams(null);
			},
			onError: (error) => {
				toast.error(`Error updating milestone: ${error.message}`, {
					id: "update-milestone",
				});
			},
		}),
	);

	const handleSubmit = (data: z.infer<typeof schema>) => {
		if (data.id) {
			updateMilestone({
				...data,
				id: data.id!,
			});
		} else {
			createMilestone({
				...data,
			});
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="h-full">
				<div className="flex w-full items-center space-x-1">
					<FormField
						control={form.control}
						name="color"
						render={({ field }) => (
							<FormItem>
								<Popover>
									<PopoverTrigger className="w-fit">
										<FormControl>
											<MilestoneIcon color={field.value} className="size-4" />
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

					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem className="flex-1">
								<FormControl>
									<Input
										variant="ghost"
										className="h-8 text-sm focus-visible:border-0"
										placeholder="Milestone name"
										autoFocus={true}
										{...field}
									/>
								</FormControl>
							</FormItem>
						)}
					/>

					<div className="flex justify-end gap-1">
						<FormField
							control={form.control}
							name="dueDate"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<Popover>
											<PopoverTrigger asChild>
												<Button size={"sm"} variant={"ghost"}>
													{!field.value ? (
														<CalendarClockIcon />
													) : (
														<span className="flex items-center gap-1 font-normal text-muted-foreground">
															{format(new Date(field.value), "MMM dd")}
														</span>
													)}
												</Button>
											</PopoverTrigger>
											<PopoverContent>
												<Calendar
													mode="single"
													captionLayout="dropdown"
													onSelect={(date) => {
														field.onChange(date?.toISOString() || null);
													}}
												/>
												<PopoverClose asChild>
													<Button
														variant={"destructive"}
														size={"sm"}
														className="w-full"
														onClick={() => field.onChange(null)}
													>
														Clear
													</Button>
												</PopoverClose>
											</PopoverContent>
										</Popover>
									</FormControl>
								</FormItem>
							)}
						/>
						<Button
							type="button"
							variant="ghost"
							className="h-8"
							size="sm"
							disabled={isCreating || isUpdating}
							onClick={() => setParams(null)}
						>
							<XIcon />
						</Button>
						<Button
							type="submit"
							variant="ghost"
							className="h-8"
							size="sm"
							disabled={isCreating || isUpdating}
						>
							{isCreating || isUpdating ? (
								<Loader2 className="animate-spin" />
							) : defaultValues?.id ? (
								<SaveIcon />
							) : (
								<PlusIcon />
							)}
						</Button>
					</div>

					{/* <FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Textarea
										className="min-h-[100px] resize-none border-none px-0 shadow-none focus-visible:ring-0"
										placeholder="Add a description..."
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="dueDate"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input
										type="date"
										className="w-fit"
										placeholder="Due date"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/> */}
				</div>
			</form>
		</Form>
	);
};
