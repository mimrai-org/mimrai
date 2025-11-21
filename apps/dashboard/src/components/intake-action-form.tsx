import { zodResolver } from "@hookform/resolvers/zod";
import type { RouterOutputs } from "@mimir/api/trpc";
import { Check, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const taskFormSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	columnId: z.string().min(1, "Column is required"),
	assigneeId: z.string().optional(),
	priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

interface IntakeActionFormProps {
	selectedItem:
		| RouterOutputs["intake"]["getIntakes"]["data"][number]
		| undefined;
	columns:
		| {
				id: string;
				name: string;
				type: string;
		  }[]
		| undefined;
	members:
		| {
				id: string;
				name: string;
		  }[]
		| undefined;
	onSubmit: (values: TaskFormValues) => Promise<void>;
	onReject: () => Promise<void>;
	isCreating: boolean;
	isRejecting: boolean;
}

const IntakeActionForm: React.FC<IntakeActionFormProps> = ({
	selectedItem,
	columns,
	members,
	onSubmit,
	onReject,
	isCreating,
	isRejecting,
}) => {
	const form = useForm<TaskFormValues>({
		resolver: zodResolver(taskFormSchema),
		defaultValues: {
			title: "",
			description: "",
			priority: "medium",
		},
	});

	// Auto-populate form when an item is selected
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

	if (!selectedItem) {
		return (
			<div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
				<h3 className="font-medium">No item selected</h3>
				<p className="text-sm">Select an item to create a task</p>
			</div>
		);
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const values = form.getValues();
		await onSubmit(values);
	};

	return (
		<div className="flex h-full flex-col overflow-hidden">
			<div className="flex h-full flex-col overflow-hidden border-t">
				<div className="flex-1 overflow-y-auto p-4">
					<h3 className="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
						Create Task
					</h3>

					<form onSubmit={handleSubmit} className="space-y-3">
						<div>
							<label
								htmlFor="title"
								className="mb-1 block text-muted-foreground text-xs"
							>
								Title
							</label>
							<input
								id="title"
								type="text"
								{...form.register("title")}
								className="w-full rounded border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
								placeholder="Task title"
							/>
							{form.formState.errors.title && (
								<p className="mt-1 text-destructive text-xs">
									{form.formState.errors.title.message}
								</p>
							)}
						</div>

						<div>
							<label
								htmlFor="description"
								className="mb-1 block text-muted-foreground text-xs"
							>
								Description
							</label>
							<textarea
								id="description"
								{...form.register("description")}
								className="h-28 w-full resize-none rounded border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
								placeholder="Task description"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label
									htmlFor="columnId"
									className="mb-1 block text-muted-foreground text-xs"
								>
									Column
								</label>
								<div className="relative">
									<select
										id="columnId"
										{...form.register("columnId")}
										className="w-full appearance-none rounded border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
									>
										<option value="">Select</option>
										{columns?.map((column) => (
											<option key={column.id} value={column.id}>
												{column.name}
											</option>
										))}
									</select>
									<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
										<svg
											className="h-4 w-4 fill-current"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
										>
											<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
										</svg>
									</div>
								</div>
								{form.formState.errors.columnId && (
									<p className="mt-1 text-destructive text-xs">
										{form.formState.errors.columnId.message}
									</p>
								)}
							</div>
							<div>
								<label
									htmlFor="priority"
									className="mb-1 block text-muted-foreground text-xs"
								>
									Priority
								</label>
								<div className="relative">
									<select
										id="priority"
										{...form.register("priority")}
										className="w-full appearance-none rounded border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
									>
										<option value="low">Low</option>
										<option value="medium">Medium</option>
										<option value="high">High</option>
										<option value="urgent">Urgent</option>
									</select>
									<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
										<svg
											className="h-4 w-4 fill-current"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
										>
											<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
										</svg>
									</div>
								</div>
							</div>
						</div>
						<div>
							<label
								htmlFor="assigneeId"
								className="mb-1 block text-muted-foreground text-xs"
							>
								Assignee
							</label>
							<div className="relative">
								<select
									id="assigneeId"
									{...form.register("assigneeId")}
									className="w-full appearance-none rounded border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
								>
									<option value="">Unassigned</option>
									{members?.map((member) => (
										<option key={member.id} value={member.id}>
											{member.name}
										</option>
									))}
								</select>
								<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
									<svg
										className="h-4 w-4 fill-current"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
									>
										<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
									</svg>
								</div>
							</div>
						</div>

						<div className="mt-6 flex gap-3">
							<button
								type="button"
								onClick={onReject}
								disabled={isRejecting}
								className="flex flex-1 items-center justify-center gap-2 rounded border border-destructive/30 bg-transparent py-2 font-medium text-destructive text-sm transition-colors hover:bg-destructive/10 disabled:opacity-50"
							>
								<Trash2 className="h-4 w-4" />
								Reject
							</button>
							<button
								type="submit"
								disabled={isCreating}
								className="flex flex-1 items-center justify-center gap-2 rounded bg-primary py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
							>
								<Check className="h-4 w-4" />
								Create Task
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default IntakeActionForm;
