import { Button } from "@mimir/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@mimir/ui/form";
import { Input } from "@mimir/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@mimir/ui/select";
import { Textarea } from "@mimir/ui/textarea";
import { columnsLabels } from "@mimir/utils/columns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import z from "zod";
import { useColumnParams } from "@/hooks/use-column-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/utils/trpc";
import { ColumnIcon } from "../column-icon";

const schema = z.object({
	id: z.string().optional(),
	name: z.string().min(1).max(255),
	description: z.string().max(5000).optional(),
	type: z.enum(["done", "to_do", "backlog", "in_progress", "review"]),
});

export const ColumnForm = ({
	defaultValues,
}: {
	defaultValues?: Partial<z.infer<typeof schema>>;
}) => {
	const { setParams } = useColumnParams();
	const queryClient = useQueryClient();
	const form = useZodForm(schema, {
		defaultValues: {
			name: "",
			description: "",
			type: "in_progress",
			...defaultValues,
		},
	});

	const { mutate: createColumn, isPending: isCreating } = useMutation(
		trpc.columns.create.mutationOptions({
			onMutate: async () => {
				toast.loading("Creating column...", { id: "create-column" });
			},
			onSuccess: (column) => {
				queryClient.setQueryData(
					trpc.columns.getById.queryKey({ id: column.id }),
					column,
				);
				queryClient.invalidateQueries(trpc.columns.get.queryOptions());
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
				toast.success("Column created successfully", { id: "create-column" });
				setParams(null);
			},
			onError: (error) => {
				toast.error(`Error creating column: ${error.message}`, {
					id: "create-column",
				});
			},
		}),
	);

	const { mutate: updateColumn, isPending: isUpdating } = useMutation(
		trpc.columns.update.mutationOptions({
			onSuccess: (column) => {
				queryClient.setQueryData(
					trpc.columns.getById.queryKey({ id: column.id }),
					column,
				);
				queryClient.invalidateQueries(trpc.columns.get.queryOptions());
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
				setParams(null);
			},
		}),
	);

	const onSubmit = async (data: z.infer<typeof schema>) => {
		if (data.id) {
			// Update existing column
			updateColumn({
				id: data.id,
				...data,
			});
		} else {
			// Create new column
			createColumn({
				...data,
				teamId: "default",
			});
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				{/* <ScrollArea className="h-[calc(100vh-160px)]"> */}
				<div className="space-y-4 px-4">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input placeholder="Name" {...field} />
								</FormControl>
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
									<Textarea placeholder="Description" {...field} />
								</FormControl>
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="type"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Type</FormLabel>
								<FormControl>
									<Select onValueChange={field.onChange} value={field.value}>
										<SelectTrigger className="w-full capitalize">
											<SelectValue placeholder="Select column type" />
										</SelectTrigger>
										<SelectContent>
											{["in_progress", "review", "done", "to_do"].map(
												(type) => (
													<SelectItem
														key={type}
														value={type}
														className="capitalize"
													>
														<ColumnIcon
															type={type as keyof typeof columnsLabels}
														/>
														{columnsLabels[type as keyof typeof columnsLabels]}
													</SelectItem>
												),
											)}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				{/* </ScrollArea> */}
				<div className="flex items-center justify-end p-4">
					<Button disabled={isCreating || isUpdating}>
						{(isCreating || isUpdating) && <Loader2 className="animate-spin" />}
						Save
					</Button>
				</div>
			</form>
		</Form>
	);
};
