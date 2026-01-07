import { Alert, AlertDescription, AlertTitle } from "@ui/components/ui/alert";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@ui/components/ui/card";
import { InfoIcon } from "lucide-react";
import { IntegrationForm } from "@/components/integrations/components";
import { UninstallIntegrationCard } from "@/components/integrations/uninstall-card";

export default function Page() {
	return (
		<div className="space-y-6">
			<Alert>
				<InfoIcon />
				<AlertTitle>Email Fetch Limit Notice</AlertTitle>
				<AlertDescription>
					There is a limit of 1000 emails fetched per day per user. Once the
					limit is reached, no more emails will be processed for that user until
					the next day.
				</AlertDescription>
			</Alert>
			<Card>
				<CardHeader>
					<CardDescription>Gmail Integration Settings</CardDescription>
				</CardHeader>
				<CardContent>
					<IntegrationForm type="gmail" />
				</CardContent>
			</Card>
			<UninstallIntegrationCard integrationType="gmail" />
		</div>
	);
}
