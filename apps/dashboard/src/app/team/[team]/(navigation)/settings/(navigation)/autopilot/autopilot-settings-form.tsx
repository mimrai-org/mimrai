"use client";
import { Button } from "@mimir/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@mimir/ui/card";
import { Checkbox } from "@mimir/ui/checkbox";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@mimir/ui/form";
import { Input } from "@mimir/ui/input";
import { Label } from "@mimir/ui/label";
import { Separator } from "@mimir/ui/separator";
import { Switch } from "@mimir/ui/switch";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@ui/lib/utils";
import {
	Bot,
	CheckSquare,
	Globe,
	ListTodo,
	Mail,
	MessageSquare,
	PenLine,
	ShieldCheck,
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

				{/* Agent Execution Policy Section */}
				<Card>
					<CardHeader className="pb-4">
						<div className="flex items-center gap-2">
							<Bot className="h-5 w-5 text-muted-foreground" />
							<CardTitle className="text-base">AI Agent Settings</CardTitle>
						</div>
						<CardDescription>
							Configure how the AI agent can autonomously work on tasks assigned
							to it
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<FormField
							control={form.control}
							name="agentExecutionPolicy.enabled"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="font-medium text-sm">
											Enable Autonomous Execution
										</FormLabel>
										<FormDescription>
											Allow the AI agent to automatically execute tasks assigned
											to it
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
											disabled={field.disabled}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<div
							className={cn("space-y-6 transition-opacity", {
								"pointer-events-none opacity-50": !agentEnabled,
							})}
						>
							<Separator />

							<FormField
								control={form.control}
								name="agentExecutionPolicy.maxStepsPerDay"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Maximum Steps Per Day</FormLabel>
										<FormDescription>
											Limit the number of actions the agent can perform daily
											(1-500)
										</FormDescription>
										<FormControl>
											<Input
												type="number"
												min={1}
												max={500}
												className="w-32"
												{...field}
												disabled={field.disabled || !agentEnabled}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Separator />

							<FormField
								control={form.control}
								name="agentExecutionPolicy.allowedActions"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Allowed Actions</FormLabel>
										<FormDescription>
											Select which actions the agent can perform autonomously
										</FormDescription>
										<div className="mt-3 grid gap-3 sm:grid-cols-2">
											{AVAILABLE_ACTIONS.map((action) => {
												const isChecked = field.value?.includes(action.value);
												const Icon = action.icon;
												return (
													<div
														key={action.value}
														className={cn(
															"flex items-start gap-3 rounded-lg border p-3 transition-colors",
															isChecked
																? "border-primary/50 bg-primary/5"
																: "border-input",
															(field.disabled || !agentEnabled) &&
																"cursor-not-allowed opacity-50",
														)}
													>
														<Checkbox
															id={action.value}
															checked={isChecked}
															disabled={field.disabled || !agentEnabled}
															onCheckedChange={(checked) => {
																const newValues = checked
																	? [...(field.value ?? []), action.value]
																	: field.value?.filter(
																			(v) => v !== action.value,
																		);
																field.onChange(newValues);
															}}
														/>
														<div className="flex-1 space-y-1">
															<Label
																htmlFor={action.value}
																className="flex cursor-pointer items-center gap-2 font-medium text-sm"
															>
																<Icon className="h-4 w-4 text-muted-foreground" />
																{action.label}
															</Label>
															<p className="text-muted-foreground text-xs">
																{action.description}
															</p>
														</div>
													</div>
												);
											})}
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Separator />

							<div className="space-y-4">
								<div className="flex items-center gap-2">
									<ShieldCheck className="h-4 w-4 text-muted-foreground" />
									<h4 className="font-medium text-sm">Safety Controls</h4>
								</div>

								<FormField
									control={form.control}
									name="agentExecutionPolicy.requireReviewForCompletion"
									render={({ field }) => (
										<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
											<div className="space-y-0.5">
												<FormLabel className="font-medium text-sm">
													Require Review for Completion
												</FormLabel>
												<FormDescription>
													Require human review before the agent can mark tasks
													as done
												</FormDescription>
											</div>
											<FormControl>
												<Switch
													checked={field.value}
													onCheckedChange={field.onChange}
													disabled={field.disabled || !agentEnabled}
												/>
											</FormControl>
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="agentExecutionPolicy.alwaysConfirmActions"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Always Confirm Actions</FormLabel>
											<FormDescription>
												Select actions that always require human confirmation,
												regardless of risk level
											</FormDescription>
											<div className="mt-3 flex flex-wrap gap-2">
												{AVAILABLE_ACTIONS.filter((action) =>
													allowedActions?.includes(action.value),
												).map((action) => {
													const isChecked = field.value?.includes(action.value);
													const Icon = action.icon;
													return (
														<Button
															key={action.value}
															type="button"
															variant={isChecked ? "default" : "outline"}
															size="sm"
															className="gap-2"
															disabled={field.disabled || !agentEnabled}
															onClick={() => {
																const newValues = isChecked
																	? field.value?.filter(
																			(v) => v !== action.value,
																		)
																	: [...(field.value ?? []), action.value];
																field.onChange(newValues);
															}}
														>
															<Icon className="h-3.5 w-3.5" />
															{action.label}
														</Button>
													);
												})}
											</div>
											{allowedActions?.length === 0 && (
												<p className="text-muted-foreground text-sm">
													Enable some actions above to configure confirmations
												</p>
											)}
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>
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
