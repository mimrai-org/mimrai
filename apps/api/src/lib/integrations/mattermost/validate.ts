import { Client4 } from "@mattermost/client";
import type { IntegrationConfig } from "../registry";

export const validateMattermost = async (
	config: IntegrationConfig<"mattermost">,
) => {
	console.log("Validating Mattermost integration with config:", config);
	const client = new Client4();
	client.setUrl(config.url);
	client.setToken(config.token);

	const me = await client.getMe();

	if (!me) {
		return false;
	}

	return true;
};
