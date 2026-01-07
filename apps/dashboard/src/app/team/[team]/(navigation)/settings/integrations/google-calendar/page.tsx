import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@ui/components/ui/card";
import { IntegrationForm } from "@/components/integrations/components";
import { UninstallIntegrationCard } from "@/components/integrations/uninstall-card";

export default function Page() {
	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardDescription>
						Google Calendar Integration Settings
					</CardDescription>
				</CardHeader>
				<CardContent>
					<IntegrationForm type="google-calendar" />
				</CardContent>
			</Card>
			<UninstallIntegrationCard integrationType="google-calendar" />
		</div>
	);
}
