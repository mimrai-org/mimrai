"use client";
import { Alert, AlertDescription, AlertTitle } from "@mimir/ui/alert";
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
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react";
import { useState } from "react";
import z from "zod";
import { useZodForm } from "@/hooks/use-zod-form";
import { queryClient, trpc } from "@/utils/trpc";
import type { IntegrationConfigFormProps } from "../components";

const schema = z.object({
	token: z.string().min(1, "Token ID is required"),
	url: z.string().url("Invalid URL"),
});

export const IntegrationMattermostForm = ({
	type,
	integration,
}: IntegrationConfigFormProps) => {
	const [error, setError] = useState<string | null>(null);
	const [isValid, setIsValid] = useState(false);
	const id = integration?.installedIntegration?.id;
	const form = useZodForm(schema, {
		defaultValues: {
			token: "",
			url: "",
			...integration?.installedIntegration?.config,
		},
	});

	const { mutateAsync: installIntegration } = useMutation(
		trpc.integrations.install.mutationOptions(),
	);

	const { mutateAsync: validateIntegration } = useMutation(
		trpc.integrations.validate.mutationOptions(),
	);

	const { mutateAsync: updateIntegration } = useMutation(
		trpc.integrations.update.mutationOptions(),
	);

	const handleSubmit = async (data: z.infer<typeof schema>) => {
		setError(null);

		if (isValid) {
			if (id) {
				// If we have an ID, we are updating an existing integration
				await updateIntegration({ id, config: data });
			} else {
				// Install the integration
				await installIntegration({ type: "mattermost", config: data });
			}
			queryClient.invalidateQueries(trpc.integrations.get.queryOptions());
		} else {
			// Validate the configuration
			const result = await validateIntegration({
				type: "mattermost",
				config: data,
			});
			if (result) {
				setIsValid(true);
			} else {
				setError("Please check your configuration.");
			}
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				<FormField
					name="token"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Access Token</FormLabel>
							<FormControl>
								<Input
									placeholder="Enter your bot access token"
									type="password"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					name="url"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>URL</FormLabel>
							<FormControl>
								<Input placeholder="Enter your Mattermost URL" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{(error || isValid) && (
					<Alert variant={error ? "destructive" : "default"}>
						{error ? <XCircleIcon /> : <CheckCircle2Icon />}
						<AlertTitle>
							{error
								? "Validation failed"
								: isValid
									? "Configuration is valid"
									: ""}
						</AlertTitle>
						{error && <AlertDescription>{error}</AlertDescription>}
					</Alert>
				)}

				<div className="mt-6 flex justify-end">
					<Button type="submit" disabled={form.formState.isSubmitting}>
						{form.formState.isSubmitting && (
							<Loader2Icon className="size-4 animate-spin" />
						)}
						{isValid ? (id ? "Update" : "Install") : "Validate"}
					</Button>
				</div>
			</form>
		</Form>
	);
};
