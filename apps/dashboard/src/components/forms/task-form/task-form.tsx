import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";
import z from "zod";
import { PriorityBadge } from "@/components/kanban/priority";
import { useTaskParams } from "@/hooks/use-task-params";
import { useZodForm } from "@/hooks/use-zod-form";
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
import { MarkdownInput } from "../../ui/markdown-input";
import { ScrollArea } from "../../ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "../../ui/select";
import { TaskAttachments } from "./attachments";
import { ColumnSelect } from "./column-select";

export const taskFormSchema = z.object({
	id: z.string().optional(),
	title: z.string().min(1).max(255),
	description: z.string().max(5000).optional(),
	assigneeId: z.string().optional(),
	columnId: z.string(),
	teamId: z.string(),
	dueDate: z.string().optional(),
	priority: z.enum(["low", "medium", "high"]).optional(),
	attachments: z.array(z.string()).optional(),
});
export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const TaskForm = ({
	defaultValues,
}: {
	defaultValues?: Partial<z.infer<typeof taskFormSchema>>;
}) => {
	const [lastSavedDate, setLastSavedDate] = useState<Date>(new Date());
	const { setParams } = useTaskParams();
	const queryClient = useQueryClient();
	const form = useZodForm(taskFormSchema, {
		defaultValues: {
			title: "",
			description: "",
			teamId: "",
			priority: "medium",
			...defaultValues,
		},
	});

	const { mutate: createTask } = useMutation(
		trpc.tasks.create.mutationOptions({
			onSuccess: (task) => {
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
				queryClient.setQueryData(
					trpc.tasks.getById.queryKey({ id: task.id }),
					task,
				);
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
				queryClient.setQueryData(
					trpc.tasks.getById.queryKey({ id: task.id }),
					task,
				);
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
			},
		}),
	);

	const formValues = form.watch();
	const isDirty = form.formState.isDirty;
	const [debouncedValue] = useDebounceValue(formValues, 500);

	useEffect(() => {
		if (debouncedValue.id && isDirty) {
			const values = form.getValues();
			if (!values.id) return;

			// Auto save for existing tasks
			updateTask({
				id: values.id,
				...values,
			});
			form.reset(values, { keepDirty: false });
			setLastSavedDate(new Date());
		}
	}, [debouncedValue]);

	const onSubmit = async (data: z.infer<typeof taskFormSchema>) => {
		if (data.id) {
			// Update existing task
			updateTask({
				...data,
				id: data.id,
			});
			setParams(null);
		} else {
			// Create new task
			createTask({
				...data,
				teamId: "default",
			});
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<ScrollArea className="min-h-[50vh]">
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
								variant={defaultValues.id ? "ghost" : "default"}
								size={"sm"}
								className="text-sm"
								disabled={
									!form.formState.isDirty || form.formState.isSubmitting
								}
							>
								{defaultValues.id
									? `Last saved at ${format(lastSavedDate, "pp")}`
									: "Create Task"}
							</Button>
						</div>
					</div>
					<div className="mx-4 grid grid-cols-[1fr_300px] gap-4">
						<div className="space-y-4 pb-4">
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<MarkdownInput
												className="min-h-[160px]"
												contentEditableClassName="min-h-[160px] hover:bg-muted focus:bg-transparent transition-colors"
												placeholder="Add description..."
												markdown={field.value ?? ""}
												onChange={(value) => field.onChange(value)}
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							<div className="px-4">
								<FormField
									control={form.control}
									name="attachments"
									render={({ field }) => (
										<TaskAttachments attachments={field.value ?? []} />
									)}
								/>
							</div>
						</div>

						<div className="space-y-4 border px-4 py-4">
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
												onChange={(value) => field.onChange(value || undefined)}
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
													<PriorityBadge value={field.value} />
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
				</ScrollArea>
				{/* <div className="flex items-center justify-end p-4">
					
				</div> */}
			</form>
		</Form>
	);
};
