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
	SelectGroup,
	SelectItem,
	SelectTrigger,
} from "@mimir/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Editor as EditorInstance } from "@tiptap/react";
import { format, formatRelative } from "date-fns";
import { ChevronDownIcon, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";
import z from "zod";
import { Editor } from "@/components/editor";
import { Priority, PriorityItem } from "@/components/kanban/priority";
import { useTaskParams } from "@/hooks/use-task-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/utils/trpc";
import { Assignee, AssigneeAvatar } from "../../kanban/asignee";
import { TaskActivitiesList } from "./activities-list";
import { TaskAttachments } from "./attachments";
import { TaskChecklist } from "./checklist";
import { ColumnSelect } from "./column-select";
import { CommentInput } from "./comment-input";
import { TaskDuplicated } from "./duplicated";
import { LabelInput } from "./label-input";
import { Recurring } from "./recurring";
import { SmartInput } from "./smart-input";
import { SubscribersList } from "./subscribers-list";

export const taskFormSchema = z.object({
	id: z.string().optional(),
	title: z.string().min(1, { message: "Task must have a title" }).max(255),
	description: z.string().max(50_000).optional(),
	assigneeId: z.string().nullable().optional(),
	columnId: z.string().min(1),
	dueDate: z.date().nullable().optional(),
	labels: z.array(z.string()).optional(),
	priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
	attachments: z.array(z.string()).optional(),
	showSmartInput: z.boolean().optional(),
	recurring: z
		.object({
			frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
			interval: z.coerce.number().min(1).max(12),
			startDate: z.string().optional(),
		})
		.optional(),
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
	const editorRef = useRef<EditorInstance | null>(null);
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
			assigneeId: null,
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

	const { mutate: createTask, isPending: isPendingCreate } = useMutation(
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

	const { mutate: updateTask, isPending: isPendingUpdate } = useMutation(
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

				const mentions = parseMentions(editorRef.current?.getJSON() || {});
				// Auto save for existing tasks
				updateTask({
					id: values.id,
					...values,
					dueDate: values.dueDate?.toISOString(),
					mentions,
				});
			}
		};
	}, [isValid, isDirty]);

	const parseMentions = (data: any) => {
		const mentions: string[] = (data.content || []).flatMap(parseMentions);
		if (data.type === "mention") {
			mentions.push(data.attrs.id);
		}
		return mentions;
	};

	const onSubmit = async (data: z.infer<typeof taskFormSchema>) => {
		const mentions = parseMentions(editorRef.current?.getJSON() || {});

		if (data.id) {
			// Update existing task
			updateTask({
				...data,
				id: data.id,
				dueDate: data.dueDate?.toISOString(),
				mentions,
			});
			setParams(null);
		} else {
			// Create new task
			createTask({
				...data,
				dueDate: data.dueDate?.toISOString(),
				mentions,
			});
		}
	};

	const createMode = !defaultValues?.id;
	const showSmartInput = createMode && formValues.showSmartInput;

	return (
		<div className="max-h-[95vh] overflow-y-auto">
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
				<>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)}>
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
									</div>
									{createMode && (
										<div className="px-8">
											<TaskDuplicated title={debouncedValue.title} />
										</div>
									)}
								</div>

								<div className="gap-4 px-4">
									<div className="space-y-4">
										<FormField
											control={form.control}
											name="description"
											render={({ field }) => (
												<FormItem>
													<FormControl>
														<Editor
															className="[&_div]:min-h-[100px]"
															placeholder="Add description..."
															value={field.value ?? ""}
															onChange={(value) => {
																field.onChange(value);
															}}
															shouldInsertImage={true}
															onUpload={async (url) => {
																const currentValue =
																	form.getValues("attachments") ?? [];
																form.setValue(
																	"attachments",
																	[...currentValue, url],
																	{
																		shouldDirty: true,
																		shouldValidate: true,
																	},
																);
															}}
															ref={editorRef}
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
																className="w-fit justify-start px-0 text-xs"
																placeholder="Add labels..."
																value={field.value ?? []}
																onChange={(value) => field.onChange(value)}
															/>
														</FormControl>
													</FormItem>
												)}
											/>

											<div className="flex flex-wrap items-center gap-2">
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
																		field.onChange(value || null)
																	}
																	getValue={(item) => item.id}
																	getLabel={(item) =>
																		item?.name || item?.email || "Unassigned"
																	}
																	variant={"secondary"}
																	size={"sm"}
																	className="h-6! w-fit px-2! py-1! text-xs"
																	placeholder="Unassigned"
																	clearable
																	renderClear={() => (
																		<div className="flex items-center gap-2">
																			<AssigneeAvatar />
																			Unassigned
																		</div>
																	)}
																	renderItem={(item) => (
																		<Assignee
																			{...item}
																			className="size-5 text-sm"
																		/>
																	)}
																	renderValue={(item) => (
																		<Assignee
																			{...item}
																			className="size-4 text-xs"
																		/>
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
																			variant="secondary"
																			className="h-6 w-fit justify-between font-normal text-xs"
																		>
																			{field.value ? (
																				formatRelative(field.value, new Date())
																			) : (
																				<span className="text-muted-foreground">
																					Due date
																				</span>
																			)}
																			<ChevronDownIcon className="text-muted-foreground" />
																		</Button>
																	</PopoverTrigger>
																	<PopoverContent
																		className="w-auto overflow-hidden p-0"
																		align="start"
																	>
																		<Calendar
																			mode="single"
																			selected={field.value || undefined}
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
																	<SelectTrigger className="h-6! border-none bg-secondary text-xs hover:bg-secondary/80 dark:bg-secondary/80 hover:dark:bg-secondary/70">
																		{field.value && (
																			<div className="flex items-center gap-2 capitalize">
																				<Priority value={field.value} />
																				{field.value}
																			</div>
																		)}
																	</SelectTrigger>
																	<SelectContent>
																		<SelectGroup>
																			<SelectItem value="low">Low</SelectItem>
																			<SelectItem value="medium">
																				Medium
																			</SelectItem>
																			<SelectItem value="high">High</SelectItem>
																			<SelectItem value="urgent">
																				Urgent
																			</SelectItem>
																		</SelectGroup>
																	</SelectContent>
																</Select>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<ColumnSelect />

												<Recurring />
											</div>
										</div>

										<hr className="my-6" />
										<div className="flex justify-between">
											<div className="space-y-4">
												<FormField
													control={form.control}
													name="attachments"
													render={({ field }) => (
														<TaskAttachments
															attachments={field.value ?? []}
															onRemove={(index) => {
																field.onChange(
																	field.value?.filter((_, i) => i !== index),
																);
															}}
														/>
													)}
												/>
											</div>

											<div className="flex items-center gap-2">
												{defaultValues?.id && (
													<span className="text-muted-foreground text-xs">
														Last saved at {format(lastSavedDate, "PP, p")}
													</span>
												)}
												<Button
													type="submit"
													variant={"default"}
													size={"sm"}
													className="text-xs"
													disabled={
														!form.formState.isDirty ||
														isPendingCreate ||
														isPendingUpdate
													}
												>
													{(isPendingCreate || isPendingUpdate) && (
														<Loader2 className="animate-spin" />
													)}
													{defaultValues?.id ? "Save" : "Create Task"}
												</Button>
											</div>
										</div>
									</div>
								</div>
							</div>
						</form>
					</Form>

					<div className="px-4">
						{defaultValues?.id && (
							<div>
								<hr className="my-6" />
								<TaskChecklist taskId={defaultValues?.id!} />
							</div>
						)}
						{defaultValues?.id && (
							<div>
								<hr className="my-6" />
								<div>
									<div className="mb-4 flex items-center justify-between">
										<span className="font-medium text-sm">Activity</span>
										{defaultValues?.id && (
											<SubscribersList taskId={defaultValues?.id!} />
										)}
									</div>
									<TaskActivitiesList taskId={defaultValues?.id} />
								</div>
								<div className="mt-4">
									<CommentInput taskId={defaultValues?.id} />
								</div>
							</div>
						)}
					</div>
				</>
			)}
		</div>
	);
};
