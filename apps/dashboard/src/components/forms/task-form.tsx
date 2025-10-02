import { useMutation, useQueryClient } from "@tanstack/react-query";
import z from "zod/v3";
import { useTaskParams } from "@/hooks/use-task-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/utils/trpc";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { MarkdownInput } from "../ui/markdown-input";
import { ScrollArea } from "../ui/scroll-area";

const schema = z.object({
	id: z.string().optional(),
	title: z.string().min(1).max(255),
	description: z.string().max(5000).optional(),
	assigneeId: z.string().optional(),
	columnId: z.string(),
	teamId: z.string(),
	dueDate: z.string().optional(),
});

export const TaskForm = ({
	defaultValues,
}: {
	defaultValues?: Partial<z.infer<typeof schema>>;
}) => {
	const { setParams } = useTaskParams();
	const queryClient = useQueryClient();
	const form = useZodForm(schema, {
		defaultValues: {
			title: "",
			description: "",
			teamId: "",
			dueDate: "",
			...defaultValues,
		},
	});

	const { mutateAsync: createTask } = useMutation(
		trpc.tasks.create.mutationOptions(),
	);

	const { mutateAsync: updateTask } = useMutation(
		trpc.tasks.update.mutationOptions(),
	);

	const onSubmit = async (data: z.infer<typeof schema>) => {
		if (data.id) {
			// Update existing task
			const task = await updateTask({
				...data,
				id: data.id,
			});
			queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
			queryClient.setQueryData(
				trpc.tasks.getById.queryKey({ id: task.id }),
				task,
			);
		} else {
			// Create new task
			const task = await createTask({
				...data,
				teamId: "default",
			});
			queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
			queryClient.setQueryData(
				trpc.tasks.getById.queryKey({ id: task.id }),
				task,
			);
		}

		setParams(null);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				{/* <ScrollArea className="h-[calc(100vh-160px)]"> */}
				<div className="space-y-4 px-4">
					<FormField
						control={form.control}
						name="title"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Title</FormLabel>
								<FormControl>
									<Input placeholder="Title" {...field} />
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
									<MarkdownInput
										className="min-h-[160px]"
										contentEditableClassName="min-h-[160px] font-sans"
										placeholder="Description"
										markdown={field.value ?? ""}
										onChange={(value) => field.onChange(value)}
									/>
								</FormControl>
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
