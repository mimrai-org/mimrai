import { Button } from "@mimir/ui/button";
import { Calendar } from "@mimir/ui/calendar";
import { DataSelectInput } from "@mimir/ui/data-select-input";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@mimir/ui/form";
import { Input } from "@mimir/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@mimir/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@mimir/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatRelative } from "date-fns";
import { ChevronDownIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";
import z from "zod";
import { Editor } from "@/components/editor";
import { PriorityBadge } from "@/components/kanban/priority";
import { useTaskParams } from "@/hooks/use-task-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/utils/trpc";
import { Assignee } from "../../kanban/asignee";
import { TaskActivitiesList } from "./activities-list";
import { TaskAttachments } from "./attachments";
import { ColumnSelect } from "./column-select";
import { CommentInput } from "./comment-input";
import { LabelInput } from "./label-input";
import { SmartInput } from "./smart-input";
import { SubscribersList } from "./subscribers-list";
import { TaskChecklist } from "./taks-checklist";
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
					trpc.tasks.getSubscribers.queryOptions({ id: task.id }),
				);
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
		<div className="max-h-[80vh] overflow-y-auto">
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
						<div className="">
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
									{defaultValues?.id && (
										<SubscribersList taskId={defaultValues?.id!} />
									)}
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
											? `${format(lastSavedDate, "PP, p")}`
											: "Create Task"}
									</Button>
								</div>
								{createMode && (
									<div className="px-8">
										<TaskDuplicated title={debouncedValue.title} />
									</div>
								)}
							</div>

							<div className="gap-4 px-4">
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

									<div>
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

										<div className="flex items-center gap-2">
											<FormField
												control={form.control}
												name="assigneeId"
												render={({ field }) => (
													<FormItem>
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
																className="w-fit px-4!"
																renderItem={(item) => (
																	<Assignee {...item} className="size-5" />
																)}
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
														<FormControl>
															<Popover>
																<PopoverTrigger asChild>
																	<Button
																		variant="ghost"
																		className="w-fit justify-between font-normal"
																	>
																		{field.value
																			? formatRelative(field.value, new Date())
																			: "Due date"}
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
											<ColumnSelect />
										</div>
									</div>

									<div className="space-y-4 px-4">
										<FormField
											control={form.control}
											name="attachments"
											render={({ field }) => (
												<TaskAttachments attachments={field.value ?? []} />
											)}
										/>
									</div>
								</div>
							</div>
						</div>
					)}
				</form>
			</Form>

			<div className="px-8">
				{defaultValues?.id && (
					<div className="mb-4">
						<TaskChecklist taskId={defaultValues?.id!} />
					</div>
				)}

				{defaultValues?.id && (
					<div>
						<div>
							<div className="mb-4 font-medium text-sm">Activity</div>
							<TaskActivitiesList taskId={defaultValues?.id} />
						</div>
						<div className="mt-4">
							<CommentInput taskId={defaultValues?.id} />
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
