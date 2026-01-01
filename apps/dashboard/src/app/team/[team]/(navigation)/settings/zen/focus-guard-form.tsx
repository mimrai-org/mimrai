"use client";

import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/ui/collapsible";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
} from "@ui/components/ui/form";
import { Input } from "@ui/components/ui/input";
import { Switch } from "@ui/components/ui/switch";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import z from "zod";
import Loader from "@/components/loader";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/utils/trpc";

const schema = z.object({
	enabled: z.boolean().default(false),
	limit: z.enum(["short", "medium", "long"]).default("short"),
	requireBreaks: z.boolean().default(false),

	focusDurationMinutes: z.number().min(5).max(180).default(25),
	minBreakDurationMinutes: z.number().min(1).max(60).default(5),
	disableSkipBreaks: z.boolean().default(false),
});

const meta = {
	limit: {
		short: {
			title: "Short",
			description: "25 minutes focus, 5 minutes break",
			settings: {
				focusDurationMinutes: 25,
				minBreakDurationMinutes: 5,
			},
		},
		medium: {
			title: "Medium",
			description: "50 minutes focus, 10 minutes break",
			settings: {
				focusDurationMinutes: 50,
				minBreakDurationMinutes: 10,
			},
		},
		long: {
			title: "Long",
			description: "90 minutes focus, 15 minutes break",
			settings: {
				focusDurationMinutes: 90,
				minBreakDurationMinutes: 15,
			},
		},
	},
};

export const FocusGuardForm = ({
	defaultValues,
}: {
	defaultValues?: Partial<z.infer<typeof schema>>;
}) => {
	const form = useZodForm(schema, {
		defaultValues: {
			enabled: false,
			limit: "short",
			requireBreaks: false,
			...defaultValues,
		},
	});
	const lastSavedEnabled = useRef(defaultValues?.enabled ?? false);

	const enabled = form.watch("enabled");

	const { mutate: updateSettings, isPending } = useMutation(
		trpc.zen.updateSettings.mutationOptions({
			onMutate: () => {
				toast.loading("Updating...", {
					id: "update-zen-settings",
				});
			},
			onSuccess: (settings) => {
				toast.success("Updated successfully", {
					id: "update-zen-settings",
				});
			},
			onError: (error) => {
				toast.error("An error occurred while updating settings", {
					id: "update-zen-settings",
				});
			},
		}),
	);

	const handleSubmit = (data: z.infer<typeof schema>) => [
		updateSettings({
			focusGuard: data,
		}),
	];

	useEffect(() => {
		// Only auto-update when enabled changes
		if (lastSavedEnabled.current === enabled) return;
		lastSavedEnabled.current = enabled;
		updateSettings({
			focusGuard: {
				...form.getValues(),
				enabled: enabled,
			},
		});
	}, [enabled]);

	const handleLimitChange = (limit: keyof typeof meta.limit) => {
		const settings = meta.limit[limit].settings;
		form.setValue("focusDurationMinutes", settings.focusDurationMinutes);
		form.setValue("minBreakDurationMinutes", settings.minBreakDurationMinutes);
		form.setValue("limit", limit);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Focus Guard Settings</CardTitle>
				<CardDescription>
					Configure your Focus Guard settings to enhance productivity and manage
					focus sessions effectively.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-6"
					>
						<FormField
							control={form.control}
							name="enabled"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div>
										<FormLabel className="mb-1">Enable Focus Guard</FormLabel>
										<p className="text-muted-foreground text-sm">
											Automatically manage focus sessions
										</p>
									</div>
									<FormControl>
										<Switch
											checked={!!field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="limit"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Focus Session Length</FormLabel>
									<FormDescription>
										Select the preferred duration for your focus sessions.
									</FormDescription>
									<FormControl>
										<div className="flex items-center gap-4">
											{Object.keys(meta.limit).map((option) => {
												const { title, description } =
													meta.limit[option as keyof typeof meta.limit];

												return (
													<Button
														key={option}
														variant={
															field.value === option ? "default" : "outline"
														}
														type="button"
														className="h-24 flex-col items-center gap-1 px-8 font-normal capitalize"
														onClick={() => {
															handleLimitChange(
																option as keyof typeof meta.limit,
															);
														}}
														disabled={!enabled}
													>
														<span>{title}</span>
														<p className="text-muted-foreground">
															{description}
														</p>
													</Button>
												);
											})}
										</div>
									</FormControl>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="requireBreaks"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div>
										<FormLabel className="mb-1">Require Breaks</FormLabel>
										<p className="text-muted-foreground text-sm">
											Enforce breaks between focus sessions
										</p>
									</div>
									<FormControl>
										<Switch
											checked={!!field.value}
											onCheckedChange={field.onChange}
											disabled={!enabled}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<Collapsible>
							<CollapsibleTrigger className="collapsible-chevron text-sm">
								Advanced Settings
							</CollapsibleTrigger>
							<CollapsibleContent className="space-y-6">
								<div />

								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="focusDurationMinutes"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Focus Duration (minutes)</FormLabel>
												<FormControl>
													<Input type="number" {...field} disabled={!enabled} />
												</FormControl>
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="minBreakDurationMinutes"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Min Break Duration (minutes)</FormLabel>
												<FormControl>
													<Input type="number" {...field} disabled={!enabled} />
												</FormControl>
											</FormItem>
										)}
									/>
								</div>
								<FormField
									control={form.control}
									name="disableSkipBreaks"
									render={({ field }) => (
										<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
											<div>
												<FormLabel className="mb-1">
													Disable Skip Breaks
												</FormLabel>
												<p className="text-muted-foreground text-sm">
													Prevent skipping breaks during focus sessions
												</p>
											</div>
											<FormControl>
												<Switch
													checked={!!field.value}
													onCheckedChange={field.onChange}
													disabled={!enabled}
												/>
											</FormControl>
										</FormItem>
									)}
								/>
							</CollapsibleContent>
						</Collapsible>

						<div className="flex justify-end">
							<Button type="submit" disabled={!enabled || isPending}>
								{isPending && <Loader />}
								Save Settings
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
};
