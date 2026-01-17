import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/ui/form";
import { Input } from "@ui/components/ui/input";
import { Textarea } from "@ui/components/ui/textarea";
import { SaveIcon } from "lucide-react";
import Loader from "@/components/loader";
import { useTaskViewParams } from "@/hooks/use-task-view-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { queryClient, trpc } from "@/utils/trpc";
import { type TaskViewFormValues, taskViewFormSchema } from "./form-type";

export const TaskViewForm = ({
	defaultValues,
	filters,
	onSubmit,
}: {
	defaultValues?: Partial<TaskViewFormValues>;
	filters?: Partial<TaskViewFormValues["filters"]>;
	onSubmit?: (values: TaskViewFormValues) => void;
}) => {
	const { setParams } = useTaskViewParams();
	const form = useZodForm(taskViewFormSchema, {
		defaultValues: {
			name: "",
			description: "",
			isDefault: false,
			viewType: "list",
			filters: {
				...defaultValues?.filters,
				...filters,
			},
			...defaultValues,
		},
	});

	const { mutate: createView, isPending: isCreating } = useMutation(
		trpc.taskViews.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.taskViews.get.queryOptions());
				setParams(null);
			},
		}),
	);
	const { mutate: updateView, isPending: isUpdating } = useMutation(
		trpc.taskViews.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.taskViews.get.queryOptions());
				setParams(null);
			},
		}),
	);

	const isLoading = isCreating || isUpdating;

	const handleSubmit = (values: TaskViewFormValues) => {
		if (defaultValues?.id) {
			// Update existing view
			updateView({
				id: defaultValues.id,
				...values,
			});
		} else {
			// Create new view
			createView({
				...values,
				filters: {
					...values.filters,
					...filters,
				},
			});
		}
		onSubmit?.(values);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Input {...field} autoFocus placeholder="View Name" />
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
							<FormControl>
								<Textarea {...field} placeholder="View Description" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end">
					<Button type="submit" disabled={isLoading} size="sm">
						{isLoading ? <Loader /> : <SaveIcon />}
						Save View
					</Button>
				</div>
			</form>
		</Form>
	);
};
