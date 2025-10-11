import { notFound } from "next/navigation";
import { IntegrationConfigForm } from "@/components/forms/integration-config-form";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { queryClient, trpc } from "@/utils/trpc";
import { LogsList } from "../logs-list";
import { LinkedUsersList } from "./linked-users-list";

export default async function Page() {
	const integrationInfo = await queryClient.fetchQuery(
		trpc.integrations.getByType.queryOptions({
			type: "mattermost",
		}),
	);

	const integration = integrationInfo.installedIntegration[0];

	if (!integration) {
		return notFound();
	}

	const id = integration.id;

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Settings</CardTitle>
				</CardHeader>
				<CardContent>
					{integration && (
						<IntegrationConfigForm
							id={id}
							type={integration.type}
							defaultValues={integration.config}
						/>
					)}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardDescription>Linked Users</CardDescription>
				</CardHeader>
				<CardContent>
					<LinkedUsersList integrationId={id} />
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardDescription>Integration logs</CardDescription>
				</CardHeader>
				<CardContent>
					<LogsList integrationId={id} />
				</CardContent>
			</Card>
		</div>
	);
}
