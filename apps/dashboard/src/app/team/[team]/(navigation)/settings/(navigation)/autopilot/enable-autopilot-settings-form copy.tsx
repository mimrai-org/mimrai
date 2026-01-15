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
import { useEffect } from "react";
import { toast } from "sonner";
import z from "zod";
import Loader from "@/components/loader";
import { useZodForm } from "@/hooks/use-zod-form";
import { queryClient, trpc } from "@/utils/trpc";

const schema = z.object({
	enabled: z.boolean(),
});

export const EnableAutopilotSettingsForm = ({
	defaultValues,
}: {
	defaultValues?: Partial<z.infer<typeof schema>>;
}) => {
	const form = useZodForm(schema, {
		defaultValues: {
			enabled: false,
			...defaultValues,
		},
	});

	const enabled = form.watch("enabled");

	const { mutate: upsertResumeSettings, isPending } = useMutation(
		trpc.autopilotSettings.upsert.mutationOptions({
			onMutate: () => {
				toast.loading("Updating autopilot settings...", {
					id: "update-autopilot-settings",
				});
			},
			onSuccess: (settings) => {
				toast.success("Autopilot settings updated successfully", {
					id: "update-autopilot-settings",
				});
				queryClient.setQueryData(
					trpc.autopilotSettings.get.queryKey(),
					settings,
				);
				form.reset(settings, { keepDirty: false });
			},
			onError: (error) => {
				toast.error(
					error.message ||
						"An error occurred while updating autopilot settings",
					{
						id: "update-autopilot-settings",
					},
				);
			},
		}),
	);

	const handleSubmit = (values: z.infer<typeof schema>) => {
		upsertResumeSettings(values);
	};

	const isDirty = form.formState.isDirty;

	useEffect(() => {
		if (!isDirty) return;
		form.handleSubmit(handleSubmit)();
	}, [enabled, isDirty]);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
				<FormField
					control={form.control}
					name="enabled"
					render={({ field }) => (
						<FormItem>
							<div className="flex gap-2">
								<FormControl>
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
								<FormLabel>Enable Autopilot</FormLabel>
							</div>
						</FormItem>
					)}
				/>
			</form>
		</Form>
	);
};
