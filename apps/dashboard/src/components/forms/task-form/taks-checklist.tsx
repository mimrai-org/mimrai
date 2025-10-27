"use client";
import { Button } from "@mimir/ui/button";
import { Checkbox } from "@mimir/ui/checkbox";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@mimir/ui/context-menu";
import { DataSelectInput } from "@mimir/ui/data-select-input";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@mimir/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@mimir/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem } from "@mimir/ui/form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { EllipsisIcon, FileIcon, PlusIcon } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Response } from "@/components/ai-elements/response";
import { Editor } from "@/components/editor";
import { Assignee, AssigneeAvatar } from "@/components/kanban/asignee";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import { queryClient, trpc } from "@/utils/trpc";

export const TaskChecklist = ({ taskId }: { taskId: string }) => {
	const [create, setCreate] = useState(false);
	const [activeUpdateId, setActiveUpdateId] = useState<string | null>(null);

	const { data } = useQuery(
		trpc.checklists.get.queryOptions({
			taskId,
		}),
	);

	const { mutate: updateChecklistItem, isPending } = useMutation(
		trpc.checklists.update.mutationOptions({
			onSuccess: (item) => {
				if (!item) return;

				queryClient.setQueryData(
					trpc.checklists.get.queryKey({ taskId }),
					(oldData) => {
						if (!oldData) return oldData;
						return oldData.map((d) =>
							d.id === item.id ? { ...d, ...item } : d,
						);
					},
				);
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
			},
		}),
	);

	const { mutate: deleteChecklistItem } = useMutation(
		trpc.checklists.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.checklists.get.queryOptions({ taskId }),
				);
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
				toast.success("Subtask deleted");
			},
		}),
	);

	return (
		<div>
			<div className="mb-2 flex items-center justify-between">
				<span className="font-medium text-sm">Subtasks</span>
			</div>
			<div className="mb-2">
				{data?.length ? (
					<div className="space-y-2">
						{data.map((item) => (
							<div key={item.id}>
								{activeUpdateId === item.id ? (
									<TaskChecklistItemForm
										id={item.id}
										taskId={taskId}
										defaultValues={{
											id: item.id,
											description: item.description,
											assigneeId: item.assigneeId || undefined,
											attachments: item.attachments || [],
										}}
										onBlur={() => setActiveUpdateId(null)}
										onSuccess={() => setActiveUpdateId(null)}
									/>
								) : (
									<div className="flex items-start justify-between gap-2 border px-4 py-3">
										<div className="flex gap-2">
											<Checkbox
												checked={item.isCompleted}
												disabled={isPending}
												onCheckedChange={(value) => {
													updateChecklistItem({
														id: item.id,
														isCompleted: value === true,
													});
												}}
												className="size-5"
											/>
											<div>
												<div
													role="button"
													tabIndex={0}
													onClick={() => setActiveUpdateId(item.id)}
													className={cn({
														"text-muted-foreground [&_*]:line-through":
															item.isCompleted,
													})}
												>
													<Response className={cn("text-sm")}>
														{item.description}
													</Response>
												</div>

												{item.attachments && item.attachments.length > 0 && (
													<div className="mt-2">
														<ChecklistItemAttachments
															attachments={item.attachments}
															onRemove={(index) => {
																const updatedAttachments =
																	item.attachments?.filter(
																		(_, i) => i !== index,
																	) || [];

																updateChecklistItem({
																	id: item.id,
																	attachments: updatedAttachments,
																});
															}}
														/>
													</div>
												)}
											</div>
										</div>
										<div className="flex items-center gap-2">
											{item.assignee && <AssigneeAvatar {...item.assignee} />}
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant={"ghost"}
														size={"icon"}
														className="size-6"
													>
														<EllipsisIcon />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent>
													<DropdownMenuItem
														variant="destructive"
														onClick={() => deleteChecklistItem({ id: item.id })}
													>
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				) : (
					<div className="text-muted-foreground text-sm" />
				)}
			</div>
			<div>
				{create ? (
					<TaskChecklistItemForm
						id="new"
						taskId={taskId}
						onSuccess={() => setCreate(false)}
						onBlur={() => setCreate(false)}
					/>
				) : (
					<Button
						variant={"secondary"}
						size={"sm"}
						type="button"
						className="text-sm"
						onClick={() => setCreate(true)}
					>
						<PlusIcon />
						Add Subtask
					</Button>
				)}
			</div>
		</div>
	);
};

const schema = z.object({
	id: z.string().optional(),
	description: z.string().min(1, "Description is required"),
	assigneeId: z.string().optional(),
	taskId: z.string(),
	attachments: z.array(z.string()).optional(),
});

export const TaskChecklistItemForm = ({
	id,
	taskId,
	defaultValues,
	onSuccess,
	onBlur,
}: {
	id: string;
	taskId: string;
	defaultValues?: Partial<z.infer<typeof schema>>;
	onSuccess: () => void;
	onBlur: () => void;
}) => {
	const form = useZodForm(schema, {
		defaultValues: {
			description: "",
			assigneeId: undefined,
			attachments: [],
			...defaultValues,
			taskId: taskId,
		},
	});

	const attachments = form.watch("attachments") || [];

	useEffect(() => {
		const handleClickOutside = async (event: MouseEvent) => {
			const formElement = document.getElementById("subtask-form");
			// if e.target has data-slot="popover-content" or is inside an element with that attribute, do nothing
			let el: HTMLElement | null = event.target as HTMLElement;
			while (el) {
				if (
					el.hasAttribute("data-slot") &&
					(el.getAttribute("data-slot") === "popover-content" ||
						el.getAttribute("data-slot") === "dropdown-menu-content" ||
						el.getAttribute("data-slot") === "context-menu-content")
				) {
					return;
				}
				el = el.parentElement;
			}

			if (formElement && !formElement.contains(event.target as Node)) {
				const valid = await form.trigger();
				if (valid && form.formState.isDirty) {
					handleSubmit(form.getValues());
				}
				onBlur();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [onBlur, form.formState.isDirty]);

	const { mutate: createChecklistItem } = useMutation(
		trpc.checklists.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.checklists.get.queryOptions({ taskId }),
				);
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
				onSuccess();
				toast.success("Subtask created");
			},
		}),
	);

	const { mutate: updateChecklistItem } = useMutation(
		trpc.checklists.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.checklists.get.queryOptions({ taskId }),
				);
				onSuccess();
				toast.info("Subtask updated");
			},
		}),
	);

	const handleSubmit = (data: z.infer<typeof schema>) => {
		if (defaultValues?.id) {
			updateChecklistItem({
				id: defaultValues.id,
				...data,
			});
		} else {
			createChecklistItem({
				...data,
			});
		}
	};

	return (
		<div className="border px-4 py-2">
			<Form {...form}>
				<form
					id="subtask-form"
					onSubmit={form.handleSubmit(handleSubmit)}
					className="space-y-1"
					onClick={(e) => {
						e.stopPropagation();
					}}
				>
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Editor
										value={field.value}
										onChange={field.onChange}
										className="py-2"
										autoFocus
										// className="border border-input p-2 text-accent-foreground placeholder:text-accent-foreground dark:bg-input/30"
										placeholder="Enter a description"
										onUpload={async (url) => {
											const currentValue = form.getValues("attachments") ?? [];
											console.log("currentValue", currentValue);
											form.setValue("attachments", [...currentValue, url]);
										}}
									/>
								</FormControl>
							</FormItem>
						)}
					/>
					{attachments.length > 0 && (
						<div className="my-4">
							<ChecklistItemAttachments
								attachments={attachments}
								onRemove={(index) => {
									const currentValue = form.getValues("attachments") ?? [];
									form.setValue(
										"attachments",
										currentValue.filter((_, i) => i !== index),
									);
								}}
							/>
						</div>
					)}
					<div className="flex justify-between">
						<Button type="submit" size={"sm"} variant={"secondary"}>
							Save Subtask
						</Button>

						<div className="flex gap-2">
							<FormField
								control={form.control}
								name="assigneeId"
								render={({ field }) => (
									<FormItem className="w-48">
										<FormControl>
											<DataSelectInput
												placeholder="Assignee"
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
						</div>
					</div>
				</form>
			</Form>
		</div>
	);
};

export const ChecklistItemAttachments = ({
	attachments,
	onRemove,
}: {
	attachments: string[];
	onRemove?: (index: number) => void;
}) => {
	return (
		<div className="flex gap-2">
			{attachments.map((url, index) => (
				<div key={url}>
					<Dialog>
						<DialogTrigger>
							<ContextMenu>
								<ContextMenuTrigger>
									<div className="group relative">
										{url.includes("image") ? (
											<Image
												src={url}
												alt="File"
												width={32}
												height={32}
												className="size-6 rounded-sm border object-cover"
											/>
										) : (
											<div className="flex size-6 items-center justify-center rounded-sm border bg-muted">
												<FileIcon className="size-3 text-muted-foreground" />
											</div>
										)}
									</div>
								</ContextMenuTrigger>
								<ContextMenuContent>
									<ContextMenuItem
										variant="destructive"
										onClick={() => onRemove?.(index)}
									>
										Remove
									</ContextMenuItem>
								</ContextMenuContent>
							</ContextMenu>
						</DialogTrigger>
						<DialogContent
							showCloseButton={false}
							className="m-0 flex h-auto min-w-[70vw] flex-col items-center justify-center border-0 bg-transparent p-0"
						>
							<DialogTitle className="size-0" />
							{url.includes("image") ? (
								<Image
									src={url}
									alt={"Attachment Preview"}
									className="size-full object-contain"
									width={800}
									height={600}
								/>
							) : (
								<a
									href={url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline"
								>
									Open Attachment
								</a>
							)}
						</DialogContent>
					</Dialog>
				</div>
			))}
		</div>
	);
};
