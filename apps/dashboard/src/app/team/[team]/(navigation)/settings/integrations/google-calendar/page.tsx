import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@ui/components/ui/card";
import { IntegrationForm } from "@/components/integrations/components";

export default function Page() {
	return (
		<div>
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
		</div>
	);
}
