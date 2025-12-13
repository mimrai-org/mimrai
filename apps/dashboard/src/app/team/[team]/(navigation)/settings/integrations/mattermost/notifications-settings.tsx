"use client";
import { Button } from "@mimir/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@mimir/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@mimir/ui/form";
import { Input } from "@mimir/ui/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/utils/trpc";

const schema = z.object({
	teamNotificationChannelId: z
		.string()
		.min(1, "Team Notification Channel ID is required")
		.optional(),
});

export const MattermostNotificationsSettings = ({
	integrationId,
}: {
	integrationId: string;
}) => {
	const { data: integration } = useQuery(
		trpc.integrations.getByType.queryOptions({ type: "mattermost" }),
	);

	const installedIntegration = integration?.installedIntegration[0];

	const form = useZodForm(schema, {
		defaultValues: {
			teamNotificationChannelId: "",
		},
	});

	useEffect(() => {
		if (integration) {
			form.reset({
				teamNotificationChannelId:
					installedIntegration?.config.teamNotificationChannelId,
			});
		}
	}, [integration]);

	const { mutate: updateIntegration, isPending } = useMutation(
		trpc.integrations.update.mutationOptions({
			onSuccess: () => {
				toast.success("Notification settings updated successfully");
			},
		}),
	);

	const handleSubmit = (data: z.infer<typeof schema>) => {
		if (!installedIntegration) return;

		updateIntegration({
			id: installedIntegration.id,
			config: {
				...installedIntegration.config,
				teamNotificationChannelId: data.teamNotificationChannelId,
			},
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Notification Settings</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-4"
					>
						<FormField
							name="teamNotificationChannelId"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Team Notification Channel</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter the channel ID for team notifications"
											{...field}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<div className="flex justify-end">
							<Button type="submit" disabled={isPending}>
								{isPending && <Loader2Icon className="animate-spin" />}
								Save Settings
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
};
