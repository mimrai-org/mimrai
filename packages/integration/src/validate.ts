import { validateMattermost } from "./mattermost/validate";
import {
	type IntegrationConfig,
	type IntegrationName,
	integrationsRegistry,
} from "./registry";

export const validateIntegration = async (
	type: IntegrationName,
	config: IntegrationConfig,
) => {
	try {
		const registry = integrationsRegistry[type];

		if (!registry) {
			throw new Error("Unsupported integration type");
		}

		const safeConfig = registry.configSchema.safeParse(config);

		if (!safeConfig.success) {
			throw new Error(`Invalid configuration: ${safeConfig.error.message}`);
		}

		switch (type) {
			case "mattermost": {
				const parsedMattermost =
					integrationsRegistry.mattermost.configSchema.parse(config);
				return await validateMattermost(parsedMattermost);
			}
			case "whatsapp":
			case "smtp":
				// Currently, these integrations do not require runtime validation
				return true;
			default:
				throw new Error("Validation not implemented for this integration type");
		}
	} catch (error) {
		console.error(error);
		return false;
	}
};
