import { IntegrationConfigForm } from "@/components/forms/integration-config-form";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { queryClient, trpc } from "@/utils/trpc";
import { LogsList } from "./logs-list";

type Props = {
	params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
	const { id } = await params;

	const integration = await queryClient.fetchQuery(
		trpc.integrations.getById.queryOptions({
			id,
		}),
	);

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Settings</CardTitle>
				</CardHeader>
				<CardContent>
					<IntegrationConfigForm
						scrollarea={false}
						id={id}
						type={integration.type}
						defaultValues={integration.config}
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
