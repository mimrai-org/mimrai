"use client";
import { t } from "@mimir/locale";
import { useMutation } from "@tanstack/react-query";
import { InfoIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import z from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useZodForm } from "@/hooks/use-zod-form";
import { queryClient, trpc } from "@/utils/trpc";

const schema = z.object({
	enabled: z.boolean(),
	cronPrompt: z.string().min(5).max(100),
	cronExpression: z.string().min(5).max(100),
	instructions: z.string().max(500),
});

export const ResumeSettingsForm = ({
	defaultValues,
}: {
	defaultValues?: Partial<z.infer<typeof schema>>;
}) => {
	const form = useZodForm(schema, {
		defaultValues: {
			enabled: false,
			cronPrompt: "",
			cronExpression: "",
			instructions: "",
			...defaultValues,
		},
	});
	const enabled = form.watch("enabled");

	const { mutate: updateResumeSettings, isPending } = useMutation(
		trpc.resumeSettings.update.mutationOptions({
			onSuccess: (settings) => {
				if (settings?.cronExpression)
					form.setValue("cronExpression", settings.cronExpression);
				toast.success("Resume settings updated successfully");
			},
			onError: (error) => {
				toast.error(
					error.message || "An error occurred while updating resume settings",
				);
			},
		}),
	);

	const { mutate: testResumeSettings, isPending: isTesting } = useMutation(
		trpc.resumeSettings.test.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.activities.get.queryOptions({
						type: ["resume_generated"],
					}),
				);
				toast.success("Resume settings tested successfully");
			},
			onError: (error) => {
				toast.error(
					error.message || "An error occurred while testing resume settings",
				);
			},
		}),
	);

	const handleSubmit = (values: z.infer<typeof schema>) => {
		updateResumeSettings(values);
	};

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
								<FormLabel>
									{t("forms.resumeSettingsForm.enabled.label")}
								</FormLabel>
							</div>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="cronPrompt"
					disabled={!enabled}
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t("forms.resumeSettingsForm.cronPrompt.label")}
							</FormLabel>
							<FormControl>
								<div className="flex">
									<Input type="text" {...field} />
									<Input
										type="text"
										value={form.getValues("cronExpression")}
										className="w-[110px] border-l-0"
										disabled
									/>
								</div>
							</FormControl>
							<FormDescription>
								{t("forms.resumeSettingsForm.cronPrompt.description")}
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="instructions"
					disabled={!enabled}
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t("forms.resumeSettingsForm.instructions.label")}
							</FormLabel>
							<FormControl>
								<Textarea {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Alert>
					<InfoIcon />
					<AlertDescription className="inline">
						{t("forms.resumeSettingsForm.alert.description")}
					</AlertDescription>
				</Alert>

				<div className="flex justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => testResumeSettings()}
						disabled={isTesting}
					>
						{isTesting && <Loader2Icon className="animate-spin" />}
						{t("forms.resumeSettingsForm.testButton.label")}
					</Button>
					<Button type="submit" disabled={isPending}>
						{isPending && <Loader2Icon className="animate-spin" />}
						{t("forms.resumeSettingsForm.submitButton.label")}
					</Button>
				</div>
			</form>
		</Form>
	);
};
