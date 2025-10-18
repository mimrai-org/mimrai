import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatRelative } from "date-fns";
import {
	ChevronDownIcon,
	GitPullRequestArrowIcon,
	GitPullRequestClosedIcon,
	GitPullRequestIcon,
	XIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";
import z from "zod";
import { Editor } from "@/components/editor";
import { PriorityBadge } from "@/components/kanban/priority";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useTaskParams } from "@/hooks/use-task-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { Assignee } from "../../kanban/asignee";
import { Button } from "../../ui/button";
import { DataSelectInput } from "../../ui/data-select-input";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../../ui/form";
import { Input } from "../../ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "../../ui/select";
import { TaskActivitiesList } from "./activities-list";
import { TaskAttachments } from "./attachments";
import { ColumnSelect } from "./column-select";
import { CommentInput } from "./comment-input";
import { LabelInput } from "./label-input";
import { SmartInput } from "./smart-input";
import { TaskDuplicated } from "./task-duplicated";

export const taskFormSchema = z.object({
	id: z.string().optional(),
	title: z.string().min(1).max(255),
	description: z.string().max(50_000).optional(),
	assigneeId: z.string().optional(),
	columnId: z.string(),
	dueDate: z.date().optional(),
	labels: z.array(z.string()).optional(),
	priority: z.enum(["low", "medium", "high"]).optional(),
	attachments: z.array(z.string()).optional(),

	showSmartInput: z.boolean().optional(),
});
export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const TaskForm = ({
	defaultValues,
	pullRequestPlan,
}: {
	defaultValues?: Partial<z.infer<typeof taskFormSchema>>;
	pullRequestPlan?: {
		id: string;
		prTitle: string | null;
		prUrl: string | null;
		status: "pending" | "completed" | "canceled" | "processing";
	} | null;
}) => {
	const [lastSavedDate, setLastSavedDate] = useState<Date>(new Date());
	const { setParams } = useTaskParams();
	const queryClient = useQueryClient();
	const form = useZodForm(taskFormSchema, {
		defaultValues: {
			title: "",
			description: "",
			priority: "medium",
			labels: [],
			showSmartInput: !defaultValues?.id,
			...defaultValues,
		},
	});

	const { mutate: removeTaskFromPullRequestPlan } = useMutation(
		trpc.github.removeTrasksFromPullRequestPlan.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
				queryClient.invalidateQueries(
					trpc.tasks.getById.queryOptions({
						id: defaultValues?.id!,
					}),
				);
			},
		}),
	);

	const { mutate: createTask } = useMutation(
		trpc.tasks.create.mutationOptions({
			onSuccess: (task) => {
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
				queryClient.invalidateQueries(trpc.tasks.get.infiniteQueryOptions());
				setParams(null);
			},
			onError: (error) => {
				toast.error("Failed to create task");
			},
		}),
	);

	const { mutate: updateTask } = useMutation(
		trpc.tasks.update.mutationOptions({
			onSuccess: (task) => {
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
				queryClient.invalidateQueries(trpc.tasks.get.infiniteQueryOptions());
				queryClient.invalidateQueries(
					trpc.activities.get.queryOptions({
						groupId: task.id,
					}),
				);
			},
		}),
	);

	const formValues = form.watch();
	const isDirty = form.formState.isDirty;
	const isValid = form.formState.isValid;
	const [debouncedValue] = useDebounceValue(formValues, 500);

	useEffect(() => {
		return () => {
			if (isValid && isDirty) {
				const values = form.getValues();
				if (!values.id) return;

				console.log("Auto saving task...", values);
				// Auto save for existing tasks
				updateTask({
					id: values.id,
					...values,
					dueDate: values.dueDate?.toISOString(),
				});
			}
		};
	}, [isValid, isDirty]);

	const onSubmit = async (data: z.infer<typeof taskFormSchema>) => {
		if (data.id) {
			// Update existing task
			updateTask({
				...data,
				id: data.id,
				dueDate: data.dueDate?.toISOString(),
			});
			setParams(null);
		} else {
			// Create new task
			createTask({
				...data,
				teamId: "default",
				dueDate: data.dueDate?.toISOString(),
			});
		}
	};

	const createMode = !defaultValues?.id;
	const showSmartInput = createMode && formValues.showSmartInput;

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				{showSmartInput ? (
					<SmartInput
						onFinish={(data) => {
							form.reset(
								{
									...defaultValues,
									...data,
									dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
									showSmartInput: false,
								},
								{
									keepDirty: true,
									keepDirtyValues: true,
									keepDefaultValues: true,
								},
							);

							// If title was generated, set it in the form and trigger validation
							if (data.title) {
								form.setValue("title", data.title, {
									shouldDirty: true,
									shouldValidate: true,
								});
								form.trigger();
							}
						}}
					/>
				) : (
					<div className="max-h-[80vh] overflow-y-auto">
						<div className="space-y-1 py-2">
							<input className="size-0 opacity-0" />
							<div className="flex items-center justify-between gap-4 px-4">
								<FormField
									control={form.control}
									name="title"
									render={({ field }) => (
										<FormItem className="flex-1">
											<FormControl>
												<Input
													variant={"ghost"}
													className="h-10 w-full font-medium focus:border-0 md:text-xl"
													placeholder="Task title"
													autoFocus={false}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<Button
									type="submit"
									variant={defaultValues?.id ? "ghost" : "default"}
									size={"sm"}
									className="text-sm"
									disabled={
										!form.formState.isDirty || form.formState.isSubmitting
									}
								>
									{defaultValues?.id
										? `Last saved at ${format(lastSavedDate, "pp")}`
										: "Create Task"}
								</Button>
							</div>
							{createMode && (
								<div className="px-8">
									<TaskDuplicated title={debouncedValue.title} />
								</div>
							)}
						</div>

						<div className="mx-4 grid grid-cols-[1fr_300px] gap-4">
							<div className="space-y-4 pb-4">
								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												{/* <MarkdownInput
												className="min-h-[160px]"
												contentEditableClassName="min-h-[160px] hover:bg-muted focus:bg-transparent transition-colors"
												placeholder="Add description..."
												markdown={field.value ?? ""}
												onChange={(value) => field.onChange(value)}
											/> */}

												<Editor
													className="px-4 [&_div]:min-h-[160px]"
													placeholder="Add description..."
													value={field.value ?? ""}
													onChange={(value) => field.onChange(value)}
												/>
											</FormControl>
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="labels"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<LabelInput
													className="justify-start"
													placeholder="Add labels..."
													value={field.value ?? []}
													onChange={(value) => field.onChange(value)}
												/>
											</FormControl>
										</FormItem>
									)}
								/>

								<div className="space-y-4 px-4">
									<FormField
										control={form.control}
										name="attachments"
										render={({ field }) => (
											<TaskAttachments attachments={field.value ?? []} />
										)}
									/>

									{defaultValues?.id && (
										<div>
											<div>
												<FormLabel className="mb-4">Activity</FormLabel>
												<TaskActivitiesList taskId={defaultValues?.id} />
											</div>
											<div className="mt-4">
												<CommentInput taskId={defaultValues?.id} />
											</div>
										</div>
									)}
								</div>
							</div>

							<div className="h-fit space-y-4 border px-4 py-4">
								<FormField
									control={form.control}
									name="assigneeId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Assignee</FormLabel>
											<FormControl>
												<DataSelectInput
													queryOptions={trpc.teams.getMembers.queryOptions()}
													value={field.value || null}
													onChange={(value) =>
														field.onChange(value || undefined)
													}
													getValue={(item) => item.id}
													getLabel={(item) =>
														item?.name || item?.email || "Unassigned"
													}
													variant={"ghost"}
													renderItem={(item) => <Assignee {...item} />}
												/>
											</FormControl>
										</FormItem>
									)}
								/>

								<FormField
									name="dueDate"
									control={form.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Due date</FormLabel>
											<FormControl>
												<Popover>
													<PopoverTrigger asChild>
														<Button
															variant="ghost"
															className="w-full justify-between font-normal"
														>
															{field.value
																? formatRelative(field.value, new Date())
																: "Select date"}
															<ChevronDownIcon />
														</Button>
													</PopoverTrigger>
													<PopoverContent
														className="w-auto overflow-hidden p-0"
														align="start"
													>
														<Calendar
															mode="single"
															selected={field.value}
															captionLayout="dropdown"
															onSelect={(date) => {
																field.onChange(date);
															}}
														/>
													</PopoverContent>
												</Popover>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									name="priority"
									control={form.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Priority</FormLabel>
											<FormControl>
												<Select
													value={field.value}
													onValueChange={field.onChange}
												>
													<SelectTrigger className="w-full rounded-xs border-none shadow-none transition-colors hover:bg-muted focus:ring-0 dark:bg-transparent">
														{field.value && (
															<PriorityBadge value={field.value} />
														)}
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="low">Low</SelectItem>
														<SelectItem value="medium">Medium</SelectItem>
														<SelectItem value="high">High</SelectItem>
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{pullRequestPlan?.prUrl && (
									<div className="mb-4">
										<FormLabel>Pull Request</FormLabel>
										<div className="mt-2 mr-1 ml-3 flex items-center justify-between">
											<Link
												href={pullRequestPlan.prUrl}
												target="_blank"
												className="flex items-start text-primary text-sm hover:text-primary/80"
												onClick={(e) => e.stopPropagation()}
											>
												{pullRequestPlan.status === "pending" && (
													<GitPullRequestArrowIcon
														className={cn("mt-1 mr-1 inline size-3")}
													/>
												)}
												{pullRequestPlan.status === "completed" && (
													<GitPullRequestIcon
														className={cn(
															"mt-1 mr-1 inline size-3 text-violet-600",
														)}
													/>
												)}
												{pullRequestPlan.prTitle}
											</Link>
											<Button
												variant="link"
												type="button"
												className="h-fit py-0 text-muted-foreground hover:text-red-600"
												size="icon"
												onClick={() => {
													if (!defaultValues?.id) return;
													removeTaskFromPullRequestPlan({
														id: pullRequestPlan.id,
														taskIds: [defaultValues.id],
													});
												}}
											>
												<XIcon className="size-3!" />
											</Button>
										</div>
									</div>
								)}

								<ColumnSelect />
							</div>
						</div>
					</div>
				)}
				{/* <div className="flex items-center justify-end p-4">
					
				</div> */}
			</form>
		</Form>
	);
};
