"use client";
import type { RouterOutputs } from "@api/trpc/routers";
import type { IntegrationName } from "@mimir/integration/registry";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@ui/components/ui/alert";
import { trpc } from "@/utils/trpc";
import { InstallIntegrationGithubForm } from "./github/install";
import { ConfigIntegrationGmailForm } from "./gmail/config";
import { InstallIntegrationGmailForm } from "./gmail/install";
import { ConfigIntegrationGoogleCalendarForm } from "./google-calendar/config";
import { InstallIntegrationGoogleCalendarForm } from "./google-calendar/install";
import { IntegrationMattermostForm } from "./mattermost/install";
import { LinkIntegrationMattermostForm } from "./mattermost/link";
import { InstallIntegrationWhatsappForm } from "./whatsapp/install";

export type IntegrationType = RouterOutputs["integrations"]["getByType"];

export interface IntegrationConfigFormProps {
	type: IntegrationName;
	integration: IntegrationType;
}

export const integrationInstallForms: Partial<
	Record<IntegrationName, React.ComponentType<IntegrationConfigFormProps>>
> = {
	github: InstallIntegrationGithubForm,
	mattermost: IntegrationMattermostForm,
	whatsapp: InstallIntegrationWhatsappForm,
	"google-calendar": InstallIntegrationGoogleCalendarForm,
	gmail: InstallIntegrationGmailForm,
};

export const integrationLinkUserForms: Partial<
	Record<IntegrationName, React.ComponentType<IntegrationConfigFormProps>>
> = {
	github: InstallIntegrationGithubForm,
	mattermost: LinkIntegrationMattermostForm,
	"google-calendar": InstallIntegrationGoogleCalendarForm,
	gmail: InstallIntegrationGmailForm,
};

export const integrationConfigForms: Partial<
	Record<IntegrationName, React.ComponentType<IntegrationConfigFormProps>>
> = {
	"google-calendar": ConfigIntegrationGoogleCalendarForm,
	github: InstallIntegrationGithubForm,
	gmail: ConfigIntegrationGmailForm,
};

export const IntegrationForm = ({ type }: { type: IntegrationName }) => {
	const { data: integration, isLoading } = useQuery(
		trpc.integrations.getByType.queryOptions({
			type,
		}),
	);

	if (isLoading) {
		return <p className="text-muted-foreground">Loading...</p>;
	}

	if (!integration) {
		return (
			<Alert>
				<AlertDescription>Integration {type} not found.</AlertDescription>
			</Alert>
		);
	}

	const FormComponent = !integration?.installedIntegration
		? integrationInstallForms[type]
		: !integration?.installedUserIntegration
			? integrationLinkUserForms[type]
			: integrationConfigForms[type];

	if (!FormComponent) {
		return (
			<Alert>
				<AlertDescription>
					No configuration available for this integration.
				</AlertDescription>
			</Alert>
		);
	}

	return <FormComponent type={type} integration={integration} />;
};
