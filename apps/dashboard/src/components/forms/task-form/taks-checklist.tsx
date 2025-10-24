"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { EllipsisIcon, PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Response } from "@/components/ai-elements/response";
import { Editor } from "@/components/editor";
import { Assignee, AssigneeAvatar } from "@/components/kanban/asignee";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { DataSelectInput } from "@/components/ui/data-select-input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
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
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.checklists.get.queryOptions({ taskId }),
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
										taskId={taskId}
										defaultValues={{
											id: item.id,
											description: item.description,
											assigneeId: item.assigneeId || undefined,
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
					<div className="text-muted-foreground text-sm">No subtasks found</div>
				)}
			</div>
			<div>
				{create ? (
					<TaskChecklistItemForm
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
});

export const TaskChecklistItemForm = ({
	taskId,
	defaultValues,
	onSuccess,
	onBlur,
}: {
	taskId: string;
	defaultValues?: Partial<z.infer<typeof schema>>;
	onSuccess: () => void;
	onBlur: () => void;
}) => {
	const form = useZodForm(schema, {
		defaultValues: {
			description: "",
			assigneeId: undefined,
			...defaultValues,
			taskId: taskId,
		},
	});

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const formElement = document.getElementById("subtask-form");
			// if e.target has data-slot="popover-content" or is inside an element with that attribute, do nothing
			let el: HTMLElement | null = event.target as HTMLElement;
			while (el) {
				if (
					el.hasAttribute("data-slot") &&
					el.getAttribute("data-slot") === "popover-content"
				) {
					return;
				}
				el = el.parentElement;
			}

			if (formElement && !formElement.contains(event.target as Node)) {
				onBlur();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [onBlur]);

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
				toast.success("Subtask updated");
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
									/>
								</FormControl>
							</FormItem>
						)}
					/>
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
