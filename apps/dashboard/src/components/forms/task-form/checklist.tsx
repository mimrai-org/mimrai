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
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/ui/collapsible";
import { Switch } from "@ui/components/ui/switch";
import { EllipsisIcon, FileIcon, PlusIcon, SaveIcon } from "lucide-react";
import ms from "ms";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Assignee, AssigneeAvatar } from "@/components/asignee-avatar";
import { Response } from "@/components/chat/response";
import { Editor } from "@/components/editor";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import { queryClient, trpc } from "@/utils/trpc";

export const TaskChecklist = ({ taskId }: { taskId: string }) => {
	const [create, setCreate] = useState(false);
	const [activeUpdateId, setActiveUpdateId] = useState<string | null>(null);
	const [showAll, setShowAll] = useState(false);

	const { data } = useQuery(
		trpc.checklists.get.queryOptions(
			{
				taskId,
			},
			{
				select: (data) => {
					if (!data || data.length === 0)
						return { data: [], hiddenCount: null };
					const newData = data.filter(
						(item) =>
							!item.isCompleted ||
							(new Date(item.updatedAt!).valueOf() >=
								Date.now() - ms("1 day") &&
								item.isCompleted),
					);
					const hiddenCount = data.length - newData.length;
					if (showAll)
						return {
							data,
							hiddenCount,
						};

					return {
						data: newData,
						hiddenCount,
					};
				},
			},
		),
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
				toast.success("Checklist item deleted");
			},
		}),
	);

	return (
		<div className="w-full">
			<Collapsible defaultOpen>
				<div className="flex w-full items-center justify-between">
					<CollapsibleTrigger className="collapsible-chevron flex items-center gap-2">
						<div className="flex items-center justify-between">
							<div className="font-medium text-sm">Checklist</div>
						</div>
					</CollapsibleTrigger>
					{data?.hiddenCount !== null && (
						<div className="flex items-center gap-2 text-muted-foreground text-xs">
							Show {data?.hiddenCount} completed item
							{data?.hiddenCount! > 1 ? "s" : ""}{" "}
							<Switch checked={showAll} onCheckedChange={setShowAll} />
						</div>
					)}
				</div>
				<CollapsibleContent className="w-full">
					<div className="my-4 w-full">
						{data?.data.length ? (
							<div className="space-y-2">
								{data.data.map((item) => (
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
											<div className="flex items-start justify-between gap-2 rounded-sm bg-input px-4 py-2 text-secondary-foreground dark:bg-input/30">
												<div className="flex gap-2">
													<Checkbox
														checked={item.isCompleted}
														onCheckedChange={(value) => {
															if (isPending) return;
															updateChecklistItem({
																id: item.id,
																isCompleted: value === true,
															});
														}}
														className="mt-0.5 size-4"
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

														{item.attachments &&
															item.attachments.length > 0 && (
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
													{item.assignee && (
														<AssigneeAvatar {...item.assignee} />
													)}
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
																onClick={() =>
																	deleteChecklistItem({ id: item.id })
																}
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
					<div className="">
						{create ? (
							<TaskChecklistItemForm
								id="new"
								taskId={taskId}
								onSuccess={() => setCreate(false)}
								onBlur={() => setCreate(false)}
							/>
						) : (
							<div className="flex justify-end">
								<Button
									variant={"ghost"}
									size={"sm"}
									type="button"
									className="text-xs"
									onClick={() => setCreate(true)}
								>
									<PlusIcon />
									Add Item
								</Button>
							</div>
						)}
					</div>
				</CollapsibleContent>
			</Collapsible>
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
			const formElement = document.getElementById("checklist-form");
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
				toast.success("Checklist item created");
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
				toast.info("Checklist item updated");
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
		<div className="rounded-sm border px-4 py-2">
			<Form {...form}>
				<div
					className="flex items-center space-y-1"
					onClick={(e) => {
						e.stopPropagation();
					}}
				>
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem className="mb-0! flex w-full flex-1 items-center">
								<FormControl>
									<Editor
										value={field.value}
										onChange={field.onChange}
										className="w-full"
										autoFocus
										placeholder="Enter a description..."
										onUpload={async (url) => {
											const currentValue = form.getValues("attachments") ?? [];
											form.setValue("attachments", [...currentValue, url], {
												shouldDirty: true,
												shouldValidate: true,
											});
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
					<div className="flex items-center justify-end gap-2 self-end">
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
											clearable
											renderClear={() => (
												<div className="flex items-center gap-2">
													<AssigneeAvatar />
													Unassigned
												</div>
											)}
											size="sm"
											variant={"ghost"}
											renderItem={(item) => <Assignee {...item} />}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<Button
							type="button"
							size={"sm"}
							variant={"ghost"}
							className="size-6 rounded-full"
							onClick={() => {
								form.handleSubmit(handleSubmit)();
							}}
						>
							<PlusIcon />
							<span className="sr-only">
								{defaultValues?.id ? "Update Item" : "Add Item"}
							</span>
						</Button>
					</div>
				</div>
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
										{url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) ? (
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
