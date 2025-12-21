import { getApiUrl } from "@mimir/utils/envs";
import { Button } from "@ui/components/ui/button";
import Link from "next/link";
import type { IntegrationConfigFormProps } from "../components";

export const InstallIntegrationGoogleCalendarForm = ({
	integration,
}: IntegrationConfigFormProps) => {
	const url = `${getApiUrl()}/api/google-calendar/oauth`;

	return (
		<div>
			<Link href={url} target="_blank" rel="noopener noreferrer">
				<Button>Connect Google Calendar</Button>
			</Link>
		</div>
	);
};
