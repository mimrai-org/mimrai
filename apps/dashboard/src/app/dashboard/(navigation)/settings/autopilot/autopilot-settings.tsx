"use client";
import { Card, CardContent, CardDescription, CardHeader } from "@mimir/ui/card";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@ui/lib/utils";
import { trpc } from "@/utils/trpc";
import { AutopilotSettingsForm } from "./autopilot-settings-form";

export const AutopilotSettings = () => {
	const { data: settings } = useQuery(
		trpc.autopilotSettings.get.queryOptions(),
	);

	return (
		<Card
			className={cn({
				"opacity-60": !settings?.enabled,
			})}
		>
			<CardHeader>
				<CardDescription />
			</CardHeader>
			<CardContent>
				{settings ? (
					<AutopilotSettingsForm defaultValues={settings} />
				) : (
					<div>Loading...</div>
				)}
			</CardContent>
		</Card>
	);
};
