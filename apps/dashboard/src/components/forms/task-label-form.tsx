"use client";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useTaskLabelParams } from "@/hooks/use-task-label-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { queryClient, trpc } from "@/utils/trpc";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

const schema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Name is required"),
	color: z.string().min(1, "Color is required"),
	description: z.string().optional(),
});

export const TaskLabelForm = ({
	defaultValues,
}: {
	defaultValues?: Partial<z.infer<typeof schema>>;
}) => {
	const { setParams } = useTaskLabelParams();
	const form = useZodForm(schema, {
		defaultValues: {
			name: "",
			color: "",
			description: "",
			...defaultValues,
		},
	});

	const { mutate: createTaskLabel } = useMutation(
		trpc.taskLabels.create.mutationOptions({
			onSuccess: (taskLabel) => {
				queryClient.invalidateQueries(trpc.taskLabels.get.queryOptions({}));
				queryClient.setQueryData(
					trpc.taskLabels.getById.queryKey({ id: taskLabel.id }),
					taskLabel,
				);
				setParams(null);
			},
		}),
	);

	const { mutate: updateTaskLabel } = useMutation(
		trpc.taskLabels.update.mutationOptions({
			onSuccess: (taskLabel) => {
				queryClient.invalidateQueries(trpc.taskLabels.get.queryOptions({}));
				queryClient.setQueryData(
					trpc.taskLabels.getById.queryKey({ id: taskLabel.id }),
					taskLabel,
				);
				setParams(null);
			},
		}),
	);

	const handleSubmit = (data: z.infer<typeof schema>) => {
		if (data.id) {
			// update
			updateTaskLabel({
				id: data.id,
				...data,
			});
		} else {
			// create
			createTaskLabel({
				...data,
			});
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input placeholder="Name" {...field} />
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
								<Textarea placeholder="Description" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</form>
		</Form>
	);
};
