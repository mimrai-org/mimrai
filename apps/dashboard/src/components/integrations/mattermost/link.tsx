"use client";
import { Alert, AlertDescription, AlertTitle } from "@mimir/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { InfoIcon } from "lucide-react";
import { trpc } from "@/utils/trpc";
import type { IntegrationConfigFormProps } from "../components";

export const LinkIntegrationMattermostForm = ({
	id,
	defaultValues,
}: IntegrationConfigFormProps) => {
	const { data } = useQuery(
		trpc.integrations.getByType.queryOptions({
			type: "mattermost",
		}),
	);

	return (
		<div>
			<Alert>
				<InfoIcon />
				<AlertDescription>
					Link your Mattermost account by chatting with our bot at{" "}
					{data?.installedIntegration?.config.url}
				</AlertDescription>
			</Alert>
		</div>
	);
};
