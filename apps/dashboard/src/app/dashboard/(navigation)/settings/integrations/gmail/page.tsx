import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@mimir/ui/card";
import { notFound } from "next/navigation";
import { queryClient, trpc } from "@/utils/trpc";
import { LogsList } from "../logs-list";
import { GmailConfigForm } from "./gmail-config-form";

export const revalidate = 0;

export default async function Page() {
	const integrationInfo = await queryClient.fetchQuery(
		trpc.integrations.getByType.queryOptions({
			type: "gmail",
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
					<CardTitle>Gmail Configuration</CardTitle>
					<CardDescription>
						Configure how Mimir processes your incoming emails.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<GmailConfigForm
						integrationId={id}
						defaultConfig={integration.config as any}
					/>
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
