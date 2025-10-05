import { useMutation, useQueryClient } from "@tanstack/react-query";
import z from "zod/v3";
import { useColumnParams } from "@/hooks/use-column-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/utils/trpc";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

const schema = z.object({
	id: z.string().optional(),
	name: z.string().min(1).max(255),
	description: z.string().max(5000).optional(),
	isFinalState: z.boolean().optional(),
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
			...defaultValues,
		},
	});

	const { mutate: createColumn } = useMutation(
		trpc.columns.create.mutationOptions({
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

	const { mutate: updateColumn } = useMutation(
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
						name="isFinalState"
						render={({ field }) => (
							<FormItem>
								<div className="flex items-center space-x-2">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<FormLabel>Is Final State?</FormLabel>
								</div>
								{field.value && (
									<FormDescription>
										Tasks moved to this column will be considered completed or
										archived.
									</FormDescription>
								)}
							</FormItem>
						)}
					/>
				</div>
				{/* </ScrollArea> */}
				<div className="flex items-center justify-end p-4">
					<Button>Save</Button>
				</div>
			</form>
		</Form>
	);
};
