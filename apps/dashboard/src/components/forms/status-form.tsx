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
import { statusesLabels } from "@mimir/utils/statuses";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import z from "zod";
import { updateStatusInCache } from "@/hooks/use-data-cache-helpers";
import { useStatusParams } from "@/hooks/use-status-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/utils/trpc";
import { StatusIcon } from "../status-icon";

const schema = z.object({
	id: z.string().optional(),
	name: z.string().min(1).max(255),
	description: z.string().max(5000).optional(),
	type: z.enum(["done", "to_do", "backlog", "in_progress", "review"]),
});

export const StatusForm = ({
	defaultValues,
}: {
	defaultValues?: Partial<z.infer<typeof schema>>;
}) => {
	const { setParams } = useStatusParams();
	const queryClient = useQueryClient();
	const form = useZodForm(schema, {
		defaultValues: {
			name: "",
			description: "",
			type: "in_progress",
			...defaultValues,
		},
	});

	const { mutate: createStatus, isPending: isCreating } = useMutation(
		trpc.statuses.create.mutationOptions({
			onMutate: async () => {
				toast.loading("Creating status...", { id: "create-status" });
			},
			onSuccess: (status) => {
				queryClient.setQueryData(
					trpc.statuses.getById.queryKey({ id: status.id }),
					status,
				);
				queryClient.invalidateQueries(trpc.statuses.get.queryOptions());
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
				toast.success("Status created successfully", { id: "create-status" });
				setParams(null);
			},
			onError: (error) => {
				toast.error(`Error creating status: ${error.message}`, {
					id: "create-status",
				});
			},
		}),
	);

	const { mutate: updateStatus, isPending: isUpdating } = useMutation(
		trpc.statuses.update.mutationOptions({
			onSuccess: (status) => {
				queryClient.setQueryData(
					trpc.statuses.getById.queryKey({ id: status.id }),
					status,
				);
				// Update status in cache - this will automatically update all tasks with this status
				updateStatusInCache(status);
				toast.success("Status updated successfully");
				setParams(null);
			},
		}),
	);

	const onSubmit = async (data: z.infer<typeof schema>) => {
		if (data.id) {
			// Update existing status
			updateStatus({
				id: data.id,
				...data,
			});
		} else {
			// Create new status
			createStatus({
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
											<SelectValue placeholder="Select status type" />
										</SelectTrigger>
										<SelectContent>
											{["in_progress", "review", "done", "to_do"].map(
												(type) => (
													<SelectItem
														key={type}
														value={type}
														className="capitalize"
													>
														<StatusIcon
															type={type as keyof typeof statusesLabels}
														/>
														{
															statusesLabels[
																type as keyof typeof statusesLabels
															]
														}
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
