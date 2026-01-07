import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@mimir/ui/card";
import { notFound } from "next/navigation";
import { IntegrationForm } from "@/components/integrations/components";
import { UninstallIntegrationCard } from "@/components/integrations/uninstall-card";
import { queryClient, trpc } from "@/utils/trpc";
import { LogsList } from "../logs-list";
import { RepositoriesList } from "./repositories-list";

export const revalidate = 0;

export default async function Page() {
	const integrationInfo = await queryClient.fetchQuery(
		trpc.integrations.getByType.queryOptions({
			type: "github",
		}),
	);

	const integration = integrationInfo.installedIntegration;

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
					{integrationInfo.isInstalledForUser ? (
						<p className="mb-4 text-muted-foreground text-sm">
							GitHub App is installed and configured.
						</p>
					) : (
						<IntegrationForm type={integration.type} />
					)}
				</CardContent>
			</Card>
			<RepositoriesList integrationId={id} />
			<Card>
				<CardHeader>
					<CardDescription>Integration logs</CardDescription>
				</CardHeader>
				<CardContent>
					<LogsList integrationId={id} />
				</CardContent>
			</Card>
			<UninstallIntegrationCard integrationType="github" />
		</div>
	);
}
