"use client";

import type { IntegrationName } from "@mimir/integration/registry";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import z from "zod";
import { useIntegrationParams } from "@/hooks/use-integration-params";
import { queryClient, trpc } from "@/utils/trpc";
import { IntegrationGithubForm } from "./integration-github-form";
import { IntegrationGmailForm } from "./integration-gmail-form";
import { IntegrationMattermostForm } from "./integration-mattermost-form";

const schemas = {
	mattermost: z.object({
		token: z.string().min(1, "Token ID is required"),
		url: z.string().url("Invalid URL"),
	}),
	github: z.object({}),
	gmail: z.object({
		refreshToken: z.string().min(1, "Refresh token is required"),
	}),
	example: z.object({}),
	whatsapp: z.object({}),
};

export const IntegrationConfigForm = <N extends IntegrationName>({
	type,
	id,
	defaultValues,
}: {
	type: N;
	id?: string;
	defaultValues?: Partial<z.infer<(typeof schemas)[N]>>;
}) => {
	const [error, setError] = useState<string | null>(null);
	const [isValid, setIsValid] = useState(false);
	const { setParams } = useIntegrationParams();

	const { mutateAsync: installIntegration } = useMutation(
		trpc.integrations.install.mutationOptions(),
	);

	const { mutateAsync: validateIntegration } = useMutation(
		trpc.integrations.validate.mutationOptions(),
	);

	const { mutateAsync: updateIntegration } = useMutation(
		trpc.integrations.update.mutationOptions(),
	);

	const handleSubmit = async (data: z.infer<(typeof schemas)[N]>) => {
		setError(null);

		if (isValid) {
			if (id) {
				// If we have an ID, we are updating an existing integration
				await updateIntegration({ id, config: data });
			} else {
				// Install the integration
				await installIntegration({ type, config: data });
			}
			queryClient.invalidateQueries(trpc.integrations.get.queryOptions());
			setParams(null);
		} else {
			// Validate the configuration
			const result = await validateIntegration({ type, config: data });
			if (result) {
				setIsValid(true);
			} else {
				setError("Please check your configuration.");
			}
		}
	};

	const getForm = () => {
		switch (type) {
			case "mattermost":
				return (
					<IntegrationMattermostForm
						defaultValues={defaultValues}
						onSubmit={handleSubmit}
						isValid={isValid}
						error={error}
						integrationId={id!}
					/>
				);
			case "github":
				return (
					<IntegrationGithubForm
						defaultValues={defaultValues}
						onSubmit={handleSubmit}
						isValid={isValid}
						error={error}
						integrationId={id!}
					/>
				);
			case "gmail":
				return (
					<IntegrationGmailForm
						defaultValues={defaultValues}
						onSubmit={handleSubmit}
						isValid={isValid}
						error={error}
						integrationId={id!}
					/>
				);
			case "whatsapp":
				return (
					<div>
						<p className="border p-2 text-muted-foreground text-sm">
							WhatsApp integration does not require configuration. Just message
							to{" "}
							<a className="underline" href="https://wa.me/+18634347933">
								+18634347933
							</a>
						</p>
					</div>
				);
			default:
				return "Integration not supported yet.";
		}
	};

	return <div className="px-4">{getForm()}</div>;
};
