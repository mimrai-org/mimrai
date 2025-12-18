import type { IntegrationName } from "@mimir/integration/registry";
import { InstallIntegrationGithubForm } from "./github/install";
import { IntegrationMattermostForm } from "./mattermost/install";
import { LinkIntegrationMattermostForm } from "./mattermost/link";
import { InstallIntegrationWhatsappForm } from "./whatsapp/install";

export interface IntegrationConfigFormProps {
	type: IntegrationName;
	id?: string;
	linkUser?: boolean;
	defaultValues?: any;
}

export const integrationInstallForms: Partial<
	Record<IntegrationName, React.ComponentType<IntegrationConfigFormProps>>
> = {
	github: InstallIntegrationGithubForm,
	mattermost: IntegrationMattermostForm,
	whatsapp: InstallIntegrationWhatsappForm,
};

export const integrationLinkUserForms: Partial<
	Record<IntegrationName, React.ComponentType<IntegrationConfigFormProps>>
> = {
	github: InstallIntegrationGithubForm,
	mattermost: LinkIntegrationMattermostForm,
};

export const IntegrationForm = ({
	type,
	id,
	linkUser,
	defaultValues,
}: IntegrationConfigFormProps) => {
	const FormComponent = linkUser
		? integrationLinkUserForms[type]
		: integrationInstallForms[type];

	if (!FormComponent) {
		return <p>Integration form not found for type: {type}</p>;
	}

	return (
		<FormComponent
			id={id}
			defaultValues={defaultValues}
			type={type}
			linkUser={linkUser}
		/>
	);
};
