"use client";
import { Button } from "@mimir/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@mimir/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@mimir/ui/form";
import { Switch } from "@mimir/ui/switch";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@ui/lib/utils";
import {
	CheckSquare,
	Globe,
	ListTodo,
	Mail,
	MessageSquare,
	PenLine,
} from "lucide-react";
import { toast } from "sonner";
import z from "zod";
import Loader from "@/components/loader";
import { useZodForm } from "@/hooks/use-zod-form";
import { queryClient, trpc } from "@/utils/trpc";

const agentExecutionPolicySchema = z.object({
	enabled: z.boolean(),
	maxStepsPerDay: z.coerce.number().min(1).max(500),
	allowedActions: z.array(
		z.enum([
			"create_task",
			"update_task",
			"create_checklist",
			"update_checklist",
			"create_comment",
			"send_email",
			"web_search",
		]),
	),
	requireReviewForCompletion: z.boolean(),
	alwaysConfirmActions: z.array(z.string()),
});

const schema = z.object({
	enabled: z.boolean(),
	enableFollowUps: z.boolean().optional().nullable(),
	allowedWeekdays: z.array(z.number().min(0).max(6)).optional().nullable(),
	agentExecutionPolicy: agentExecutionPolicySchema,
});

type FormValues = z.infer<typeof schema>;

const AVAILABLE_ACTIONS = [
	{
		value: "create_task",
		label: "Create Tasks",
		description: "Allow the agent to create new tasks",
		icon: ListTodo,
	},
	{
		value: "update_task",
		label: "Update Tasks",
		description: "Allow the agent to modify existing tasks",
		icon: PenLine,
	},
	{
		value: "create_checklist",
		label: "Create Checklists",
		description: "Allow the agent to add checklist items",
		icon: CheckSquare,
	},
	{
		value: "update_checklist",
		label: "Update Checklists",
		description: "Allow the agent to modify checklist items",
		icon: CheckSquare,
	},
	{
		value: "create_comment",
		label: "Create Comments",
		description: "Allow the agent to post comments on tasks",
		icon: MessageSquare,
	},
	{
		value: "send_email",
		label: "Send Emails",
		description: "Allow the agent to send emails (high risk)",
		icon: Mail,
	},
	{
		value: "web_search",
		label: "Web Search",
		description: "Allow the agent to search the web for information",
		icon: Globe,
	},
] as const;

const WEEKDAYS = [
	{ label: "Sun", value: 0 },
	{ label: "Mon", value: 1 },
	{ label: "Tue", value: 2 },
	{ label: "Wed", value: 3 },
	{ label: "Thu", value: 4 },
	{ label: "Fri", value: 5 },
	{ label: "Sat", value: 6 },
];

export const AutopilotSettingsForm = ({
	defaultValues,
	enabled,
}: {
	defaultValues?: Partial<FormValues>;
	enabled?: boolean;
}) => {
	const form = useZodForm(schema, {
		defaultValues: {
			enableFollowUps: false,
			allowedWeekdays: [1, 2, 3, 4, 5],
			agentExecutionPolicy: {
				enabled: false,
				maxStepsPerDay: 50,
				allowedActions: [
					"create_task",
					"update_task",
					"create_checklist",
					"update_checklist",
					"create_comment",
					"web_search",
				],
				requireReviewForCompletion: true,
				alwaysConfirmActions: ["send_email"],
			},
			...defaultValues,
		},
		disabled: !enabled,
	});

	const { mutate: upsertAutopilotSettings, isPending } = useMutation(
		trpc.autopilotSettings.upsert.mutationOptions({
			onMutate: () => {
				toast.loading("Updating settings...", {
					id: "update-autopilot-settings",
				});
			},
			onSuccess: (settings) => {
				toast.success("Settings updated successfully", {
					id: "update-autopilot-settings",
				});
				queryClient.setQueryData(
					trpc.autopilotSettings.get.queryKey(),
					settings,
				);
			},
			onError: (error) => {
				toast.error(
					error.message || "An error occurred while updating settings",
					{
						id: "update-autopilot-settings",
					},
				);
			},
		}),
	);

	const handleSubmit = (values: FormValues) => {
		upsertAutopilotSettings({
			...values,
			enabled,
		});
	};

	const agentEnabled = form.watch("agentExecutionPolicy.enabled");
	const allowedActions = form.watch("agentExecutionPolicy.allowedActions");

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
				{/* Follow-ups Section */}
				<Card>
					<CardHeader className="pb-4">
						<CardTitle className="text-base">Follow-ups</CardTitle>
						<CardDescription>
							Configure automatic follow-up reminders for tasks
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<FormField
							control={form.control}
							name="enableFollowUps"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="font-medium text-sm">
											Enable Follow-Ups
										</FormLabel>
										<FormDescription>
											Automatically send follow-up messages for overdue tasks
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={!!field.value}
											onCheckedChange={field.onChange}
											disabled={field.disabled}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="allowedWeekdays"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Active Days</FormLabel>
									<FormDescription>
										Select which days the autopilot features should be active
									</FormDescription>
									<FormControl>
										<div className="mt-2 flex flex-wrap">
											{WEEKDAYS.map((day) => (
												<Button
													key={day.value}
													type="button"
													size="sm"
													className={cn(
														"rounded-none border-y border-l first:rounded-l-md last:rounded-r-md last:border-r",
														field.value?.includes(day.value)
															? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
															: "border-input bg-background hover:bg-accent",
													)}
													variant="ghost"
													disabled={field.disabled}
													onClick={() => {
														const newValues = field.value?.includes(day.value)
															? field.value?.filter((d) => d !== day.value)
															: [...(field.value ?? []), day.value];
														field.onChange(newValues);
													}}
												>
													{day.label}
												</Button>
											))}
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
				</Card>

				<div className="flex justify-end gap-2">
					<Button type="submit" disabled={isPending || !enabled}>
						{isPending && <Loader />}
						Save Settings
					</Button>
				</div>
			</form>
		</Form>
	);
};
