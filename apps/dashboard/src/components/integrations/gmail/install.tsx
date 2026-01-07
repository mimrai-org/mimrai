import { getApiUrl } from "@mimir/utils/envs";
import { Button } from "@ui/components/ui/button";
import Link from "next/link";
import type { IntegrationConfigFormProps } from "../components";

export const InstallIntegrationGmailForm = ({
	integration,
}: IntegrationConfigFormProps) => {
	const url = `${getApiUrl()}/api/gmail/oauth`;

	return (
		<div>
			<Link href={url} target="_blank" rel="noopener noreferrer">
				<Button>Connect Gmail</Button>
			</Link>
		</div>
	);
};
