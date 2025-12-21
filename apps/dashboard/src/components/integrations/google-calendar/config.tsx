"use client";
import { useMutation } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@ui/components/ui/alert";
import { Button } from "@ui/components/ui/button";
import { Form, FormField, FormItem } from "@ui/components/ui/form";
import { Switch } from "@ui/components/ui/switch";
import { SaveIcon } from "lucide-react";
import { toast } from "sonner";
import z from "zod";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/utils/trpc";

const schema = z.object({
	syncEvents: z.boolean().optional().default(true),
});

export const ConfigIntegrationGoogleCalendarForm = () => {
	const form = useZodForm(schema, {
		defaultValues: {
			syncEvents: true,
		},
	});

	const { mutate } = useMutation(
		trpc.integrations.updateLinkedUser.mutationOptions({
			onMutate: () => {
				toast.loading("Updating configuration...", {
					id: "update-google-calendar-config",
				});
			},
			onSuccess: (data) => {
				toast.success("Configuration updated successfully", {
					id: "update-google-calendar-config",
				});
			},
			onError: (error) => {
				toast.error("Failed to update configuration", {
					id: "update-google-calendar-config",
				});
			},
		}),
	);

	const handleSubmit = (data: z.infer<typeof schema>) => {
		mutate({
			integrationType: "google-calendar",
			config: data,
		});
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
				<FormField
					name="syncEvents"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<Alert className="flex items-center justify-between bg-transparent">
								<div>
									<AlertTitle>Sync Events</AlertTitle>
									<AlertDescription>
										Enable to keep your events synchronized.
									</AlertDescription>
								</div>
								<div>
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</div>
							</Alert>
						</FormItem>
					)}
				/>
				<div className="flex items-center justify-end gap-2">
					<Button>
						<SaveIcon />
						Save
					</Button>
				</div>
			</form>
		</Form>
	);
};
