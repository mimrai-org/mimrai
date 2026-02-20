import type { IntegrationConfigFormProps } from "../components";
import { ConfigIntegrationSmtpForm } from "./config";

export const InstallIntegrationSmtpForm = (
	props: IntegrationConfigFormProps,
) => {
	return <ConfigIntegrationSmtpForm {...props} />;
};
