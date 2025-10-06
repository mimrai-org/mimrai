"use client";

import type { IntegrationName } from "@mimir/api/integrations/registry";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import z from "zod";
import { useIntegrationParams } from "@/hooks/use-integration-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { queryClient, trpc } from "@/utils/trpc";
import { IntegrationMattermostForm } from "./integration-mattermost-form";

const schemas = {
	mattermost: z.object({
		token: z.string().min(1, "Token ID is required"),
		url: z.string().url("Invalid URL"),
	}),
	example: z.object({}),
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
	const form = useZodForm(schemas[type], {
		defaultValues: defaultValues as any,
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

	form.watch(() => {
		setIsValid(false);
	});

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
			default:
				return "Integration not supported yet.";
		}
	};

	return <div className="px-4">{getForm()}</div>;
};
