"use client";
import { Button } from "@mimir/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@mimir/ui/form";
import { Switch } from "@mimir/ui/switch";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import z from "zod";
import Loader from "@/components/loader";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/utils/trpc";

const schema = z.object({
	enabled: z.boolean(),
	enableFollowUps: z.boolean().optional().nullable(),
	allowedWeekdays: z.array(z.number().min(0).max(6)).optional().nullable(),
});

export const AutopilotSettingsForm = ({
	defaultValues,
	enabled,
}: {
	defaultValues?: Partial<z.infer<typeof schema>>;
	enabled?: boolean;
}) => {
	const form = useZodForm(schema, {
		defaultValues: {
			enableFollowUps: false,
			allowedWeekdays: [1, 2, 3, 4, 5],
			...defaultValues,
		},
		disabled: !enabled,
	});

	const { mutate: upsertAutopilotSettings, isPending } = useMutation(
		trpc.autopilotSettings.upsert.mutationOptions({
			onMutate: () => {
				toast.loading("Updating...", {
					id: "update-autopilot-settings",
				});
			},
			onSuccess: (settings) => {
				toast.success("Updated successfully", {
					id: "update-autopilot-settings",
				});
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

	const handleSubmit = (values: z.infer<typeof schema>) => {
		upsertAutopilotSettings({
			...values,
			enabled,
		});
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
				<FormField
					control={form.control}
					name="enableFollowUps"
					render={({ field }) => (
						<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
							<div>
								<FormLabel className="mb-1">Enable Follow-Ups</FormLabel>
								<p className="text-muted-foreground text-sm">
									Automatically send follow-up messages
								</p>
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
							<FormLabel>Allowed Weekdays</FormLabel>
							<FormControl>
								<div className="mt-2 flex flex-wrap">
									{[
										{ label: "Sun", value: 0 },
										{ label: "Mon", value: 1 },
										{ label: "Tue", value: 2 },
										{ label: "Wed", value: 3 },
										{ label: "Thu", value: 4 },
										{ label: "Fri", value: 5 },
										{ label: "Sat", value: 6 },
									].map((day) => (
										<Button
											key={day.value}
											className="rounded-none border-transparent! border-y-input! border-l-input! first:rounded-l-sm last:rounded-r-sm last:border-r-input!"
											variant={
												field.value?.includes(day.value) ? "default" : "outline"
											}
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
						</FormItem>
					)}
				/>

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
