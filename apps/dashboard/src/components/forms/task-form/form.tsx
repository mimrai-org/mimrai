"use client";
import { Button } from "@mimir/ui/button";
import { Form } from "@mimir/ui/form";
import { getTaskPermalink } from "@mimir/utils/tasks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Editor as EditorInstance } from "@tiptap/react";
import { format } from "date-fns";
import { Link2Icon, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";
import type z from "zod";
import { useUser } from "@/components/user-provider";
import { useTaskParams } from "@/hooks/use-task-params";
import { useFormAutoSave, useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/utils/trpc";
import { ActionsMenu } from "./actions-menu";
import { TaskActivitiesList } from "./activities-list";
import { Attachments } from "./attachments";
import { TaskChecklist } from "./checklist";
import { CommentInput } from "./comment-input";
import { Description } from "./description";
import { TaskDuplicated } from "./duplicated";
import { taskFormSchema } from "./form-type";
import { TaskFormProperties } from "./properties";
import { SmartInput } from "./smart-input";
import { SubscribersList } from "./subscribers-list";
import { Title } from "./title";

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
	const user = useUser();
	const editorRef = useRef<EditorInstance | null>(null);
	const [lastSavedDate, setLastSavedDate] = useState<Date>(new Date());
	const { setParams } = useTaskParams();
	const queryClient = useQueryClient();

	const form = useZodForm(taskFormSchema, {
		defaultValues: {
			title: "",
			description: "",
			priority: "low",
			labels: [],
			showSmartInput: !defaultValues?.id,
			assigneeId: user?.id || null,
			...defaultValues,
		},
	});

	const [id, permalinkId] = form.watch(["id", "permalinkId"]);

	const { mutate: createTask, isPending: isPendingCreate } = useMutation(
		trpc.tasks.create.mutationOptions({
			onMutate: () => {
				toast.loading("Creating task...", { id: "create-task" });
			},
			onSuccess: (task) => {
				toast.success("Task created successfully", { id: "create-task" });
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
				queryClient.invalidateQueries(trpc.tasks.get.infiniteQueryOptions());
				setParams(null);
			},
			onError: (error) => {
				toast.error("Failed to create task", { id: "create-task" });
			},
		}),
	);

	const { mutate: updateTask, isPending: isPendingUpdate } = useMutation(
		trpc.tasks.update.mutationOptions({
			onMutate: () => {
				toast.loading("Updating task...", { id: "update-task" });
			},
			onError: (error) => {
				toast.error("Failed to update task", { id: "update-task" });
			},
			onSuccess: (task) => {
				toast.success("Task updated successfully", { id: "update-task" });
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
				queryClient.invalidateQueries(
					trpc.tasks.getById.queryOptions({ id: task.id }),
				);
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

	const title = form.watch("title");
	const [debouncedTitle] = useDebounceValue(title, 500);

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
				mentions,
			});
		} else {
			// Create new task
			createTask({
				...data,
				mentions,
			});
		}
	};

	useFormAutoSave(form, onSubmit, {
		enabled: Boolean(id),
		ignoreFields: ["showSmartInput"],
	});

	const createMode = !id;
	const formShowSmartInput = form.watch("showSmartInput");
	const showSmartInput = createMode && formShowSmartInput;

	return (
		<div>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					{showSmartInput ? (
						<SmartInput />
					) : (
						<>
							<div className="pt-4">
								<div className="space-y-1 py-2">
									<input className="hidden size-0 opacity-0" />
									{defaultValues?.sequence >= 0 && (
										<div className="flex gap-2 px-4 text-muted-foreground text-xs">
											<span>
												{user?.team?.prefix}-{defaultValues?.sequence}
											</span>
										</div>
									)}
									<div className="flex items-center justify-between gap-4 px-4">
										<Title />
									</div>
									{createMode && (
										<div className="px-8">
											<TaskDuplicated title={debouncedTitle} />
										</div>
									)}
								</div>

								<div className="gap-4 px-4">
									<div className="space-y-4">
										<Description editorRef={editorRef} />
										<div className="mb-4">
											<TaskFormProperties />
										</div>

										<div className="flex flex-wrap items-center justify-between gap-2">
											<Attachments />

											<div className="flex flex-wrap items-center gap-2">
												{id && (
													<span className="mr-2 text-muted-foreground text-xs">
														Last saved at {format(lastSavedDate, "PP, p")}
													</span>
												)}
												{id && (
													<Button
														variant={"ghost"}
														size="icon"
														type="button"
														aria-label="Copy task link"
														onClick={() => {
															navigator.clipboard.writeText(
																getTaskPermalink(permalinkId ?? id!),
															);
															toast.success("Task link copied to clipboard");
														}}
													>
														<Link2Icon />
													</Button>
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
													{id ? "Save Changes" : "Create Task"}
												</Button>

												{id && <ActionsMenu />}
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className="px-4">
								{id && (
									<div>
										<hr className="my-6" />
										<TaskChecklist taskId={id!} />
									</div>
								)}
								{id && (
									<div>
										<hr className="my-6" />
										<div className="mb-4 flex items-center justify-between">
											<span className="font-medium text-sm">Activity</span>
											{id && <SubscribersList taskId={id!} />}
										</div>
										<TaskActivitiesList taskId={id} />
										<div className="mt-4">
											<CommentInput taskId={id} />
										</div>
									</div>
								)}
							</div>
						</>
					)}
				</form>
			</Form>
		</div>
	);
};
