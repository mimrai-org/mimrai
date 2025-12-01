"use client";
import { Card, CardContent, CardDescription, CardHeader } from "@mimir/ui/card";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { AutopilotSettingsForm } from "./autopilot-settings-form";
import { EnableAutopilotSettingsForm } from "./enable-autopilot-settings-form copy";

export const EnableAutopilotSettings = () => {
	const { data: settings } = useQuery(
		trpc.autopilotSettings.get.queryOptions(),
	);

	return (
		<Card>
			<CardHeader>
				<CardDescription>
					Autopilot helps automate your workflows and improve productivity.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{settings ? (
					<EnableAutopilotSettingsForm defaultValues={settings} />
				) : (
					<div>Loading...</div>
				)}
			</CardContent>
		</Card>
	);
};
