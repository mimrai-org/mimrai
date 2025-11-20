"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@ui/components/ui/avatar";
import { Badge } from "@ui/components/ui/badge";
import { Button } from "@ui/components/ui/button";
import { Card, CardHeader, CardTitle } from "@ui/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/ui/form";
import { Input } from "@ui/components/ui/input";
import { ScrollArea } from "@ui/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/ui/select";
import { Separator } from "@ui/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/ui/table";
import { Textarea } from "@ui/components/ui/textarea";
import { format } from "date-fns";
import { Check, Mail, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { trpc } from "@/utils/trpc";

const taskFormSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	columnId: z.string().min(1, "Column is required"),
	assigneeId: z.string().optional(),
	priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function IntakePage() {
	const queryClient = useQueryClient();
	const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

	const { data: intakeItems, isLoading } = useQuery(
		trpc.intake.getPending.queryOptions({
			limit: 50,
		}),
	);

	const { data: columnsData } = useQuery(
		trpc.columns.get.queryOptions({
			type: ["to_do", "in_progress", "backlog"],
		}),
	);

	const { data: membersData } = useQuery(trpc.teams.getMembers.queryOptions());

	const columns = columnsData?.data;
	const members = membersData;

	const selectedItem = intakeItems?.find((item) => item.id === selectedItemId);

	const form = useForm<TaskFormValues>({
		resolver: zodResolver(taskFormSchema),
		defaultValues: {
			title: "",
			description: "",
			priority: "medium",
		},
	});

	// Auto-populate form when an item is selected - using useEffect
	useEffect(() => {
		if (selectedItem && columns) {
			const defaultColumn = columns.find((c) => c.type === "to_do");
			form.reset({
				title:
					selectedItem.aiAnalysis?.suggestedTitle ||
					selectedItem.metadata?.subject ||
					"",
				description:
					selectedItem.aiAnalysis?.suggestedDescription ||
					selectedItem.content.substring(0, 500),
				columnId: defaultColumn?.id,
				priority: selectedItem.aiAnalysis?.suggestedPriority || "medium",
			});
		}
	}, [selectedItem?.id, columns, form]);

	const { mutateAsync: createTask, isPending: isCreating } = useMutation(
		trpc.intake.acceptAndCreateTask.mutationOptions({
			onSuccess: () => {
				toast.success("Task created successfully!");
				queryClient.invalidateQueries({
					queryKey: [["intake", "getPending"]],
				});
				// Move to next item
				const index =
					intakeItems?.findIndex((i) => i.id === selectedItemId) ?? -1;
				if (index !== -1 && intakeItems && index < intakeItems.length - 1) {
					setSelectedItemId(intakeItems[index + 1]!.id);
				} else {
					setSelectedItemId(null);
				}
			},
			onError: (error: any) => {
				toast.error(error.message || "Failed to create task");
			},
		}),
	);

	const { mutateAsync: rejectItem, isPending: isRejecting } = useMutation(
		trpc.intake.updateStatus.mutationOptions({
			onSuccess: () => {
				toast.success("Item rejected");
				queryClient.invalidateQueries({
					queryKey: [["intake", "getPending"]],
				});
				// Move to next item
				const index =
					intakeItems?.findIndex((i) => i.id === selectedItemId) ?? -1;
				if (index !== -1 && intakeItems && index < intakeItems.length - 1) {
					setSelectedItemId(intakeItems[index + 1]!.id);
				} else {
					setSelectedItemId(null);
				}
			},
			onError: (error: any) => {
				toast.error(error.message || "Failed to reject item");
			},
		}),
	);

	const handleCreateTask = async (values: TaskFormValues) => {
		if (!selectedItemId) return;
		await createTask({
			id: selectedItemId,
			...values,
		});
	};

	const handleReject = async () => {
		if (!selectedItemId) return;
		await rejectItem({ id: selectedItemId, status: "rejected" });
	};

	return (
		<div className="flex h-[calc(100vh-5rem)] gap-4">
			{/* Left: Table of Pending Items */}
			<Card className="flex h-full flex-1 flex-col overflow-hidden">
				<CardHeader className="border-b pb-3">
					<CardTitle className="flex items-center gap-2">
						<Mail className="h-5 w-5" />
						Pending Items
						{intakeItems && intakeItems.length > 0 && (
							<Badge variant="secondary" className="ml-auto">
								{intakeItems.length}
							</Badge>
						)}
					</CardTitle>
				</CardHeader>
				<ScrollArea className="flex-1">
					{isLoading ? (
						<div className="p-8 text-center text-muted-foreground">
							Loading...
						</div>
					) : intakeItems?.length === 0 ? (
						<div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
							<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
								<Check className="h-6 w-6" />
							</div>
							<p className="font-medium">All caught up!</p>
							<p className="text-sm">No pending items to review</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>From</TableHead>
									<TableHead>Subject</TableHead>
									<TableHead>Source</TableHead>
									<TableHead className="w-[100px]">Date</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{intakeItems?.map((item) => (
									<TableRow
										key={item.id}
										className={`cursor-pointer ${
											selectedItemId === item.id
												? "bg-accent"
												: "hover:bg-muted/50"
										}`}
										onClick={() => setSelectedItemId(item.id)}
									>
										<TableCell className="font-medium">
											<div className="flex items-center gap-2">
												<Avatar className="h-8 w-8">
													<AvatarFallback className="text-xs">
														{item.metadata?.sender?.charAt(0).toUpperCase() ||
															"?"}
													</AvatarFallback>
												</Avatar>
												<span className="max-w-[200px] truncate">
													{item.metadata?.sender || "Unknown"}
												</span>
											</div>
										</TableCell>
										<TableCell>
											<div className="flex flex-col gap-1">
												<span className="font-medium">
													{item.metadata?.subject || "No Subject"}
												</span>
												<span className="line-clamp-1 text-muted-foreground text-xs">
													{item.metadata?.snippet ||
														item.content.substring(0, 80)}
												</span>
											</div>
										</TableCell>
										<TableCell>
											<Badge variant="outline" className="capitalize">
												{item.source}
											</Badge>
										</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{item.createdAt
												? format(new Date(item.createdAt), "MMM d")
												: ""}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</ScrollArea>
			</Card>

			{/* Right: Context (Top) + Actions (Bottom) */}
			<div className="flex h-full w-[500px] flex-col gap-4">
				{/* Top Section: Email Context */}
				<Card className="flex flex-[3] flex-col overflow-hidden">
					{selectedItem ? (
						<>
							<CardHeader className="border-b pb-4">
								<div className="flex flex-col gap-2">
									<h2 className="font-semibold text-lg leading-tight">
										{selectedItem.metadata?.subject || "No Subject"}
									</h2>
									<div className="flex items-center gap-3 text-muted-foreground text-sm">
										<Avatar className="h-8 w-8">
											<AvatarFallback>
												{selectedItem.metadata?.sender
													?.charAt(0)
													.toUpperCase() || "?"}
											</AvatarFallback>
										</Avatar>
										<div className="flex flex-col">
											<span className="font-medium text-foreground">
												{selectedItem.metadata?.sender}
											</span>
											<span className="text-xs">
												{selectedItem.createdAt &&
													format(
														new Date(selectedItem.createdAt),
														"MMM d, yyyy 'at' h:mm a",
													)}
											</span>
										</div>
									</div>
								</div>
							</CardHeader>
							<ScrollArea className="flex-1">
								<div className="p-4">
									{selectedItem.metadata?.originalHtml ? (
										<div
											className="prose prose-sm dark:prose-invert max-w-none"
											dangerouslySetInnerHTML={{
												__html: selectedItem.metadata.originalHtml,
											}}
										/>
									) : (
										<div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
											{selectedItem.content}
										</div>
									)}
								</div>
							</ScrollArea>
						</>
					) : (
						<div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
							<Mail className="mb-4 h-12 w-12 opacity-20" />
							<h3 className="font-medium">Select an item to review</h3>
							<p className="text-sm">
								Choose a pending item from the table to view details
							</p>
						</div>
					)}
				</Card>

				{/* Bottom Section: Action Form */}
				<Card className="flex flex-[2] flex-col overflow-hidden">
					{selectedItem ? (
						<>
							<CardHeader className="border-b pb-3">
								<CardTitle className="text-base">Create Task</CardTitle>
							</CardHeader>
							<ScrollArea className="flex-1">
								<div className="p-4">
									<Form {...form}>
										<form
											onSubmit={form.handleSubmit(handleCreateTask)}
											className="space-y-3"
										>
											<FormField
												control={form.control}
												name="title"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Title</FormLabel>
														<FormControl>
															<Input placeholder="Task title" {...field} />
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
															<Textarea
																placeholder="Task description"
																{...field}
																rows={3}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<div className="grid grid-cols-2 gap-3">
												<FormField
													control={form.control}
													name="columnId"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Column</FormLabel>
															<Select
																onValueChange={field.onChange}
																defaultValue={field.value}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue placeholder="Select" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{columns?.map((column) => (
																		<SelectItem
																			key={column.id}
																			value={column.id}
																		>
																			{column.name}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name="priority"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Priority</FormLabel>
															<Select
																onValueChange={field.onChange}
																defaultValue={field.value}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	<SelectItem value="low">Low</SelectItem>
																	<SelectItem value="medium">Medium</SelectItem>
																	<SelectItem value="high">High</SelectItem>
																	<SelectItem value="urgent">Urgent</SelectItem>
																</SelectContent>
															</Select>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											<FormField
												control={form.control}
												name="assigneeId"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Assignee</FormLabel>
														<Select
															onValueChange={field.onChange}
															defaultValue={field.value}
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Unassigned" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{members?.map(
																	(member: { id: string; name: string }) => (
																		<SelectItem
																			key={member.id}
																			value={member.id}
																		>
																			{member.name}
																		</SelectItem>
																	),
																)}
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>

											<Separator className="my-4" />

											<div className="flex gap-2">
												<Button
													type="button"
													variant="outline"
													onClick={handleReject}
													disabled={isRejecting}
													className="flex-1 text-destructive hover:text-destructive"
												>
													<Trash2 className="mr-2 h-4 w-4" />
													Reject
												</Button>
												<Button
													type="submit"
													disabled={isCreating}
													className="flex-1"
												>
													<Check className="mr-2 h-4 w-4" />
													Create Task
												</Button>
											</div>
										</form>
									</Form>
								</div>
							</ScrollArea>
						</>
					) : (
						<div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
							<h3 className="font-medium">No item selected</h3>
							<p className="text-sm">Select an item to create a task</p>
						</div>
					)}
				</Card>
			</div>
		</div>
	);
}
