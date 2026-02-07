"use client";
import { Skeleton } from "@mimir/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@ui/lib/utils";
import { trpc } from "@/utils/trpc";
import { AutopilotSettingsForm } from "./autopilot-settings-form";

export const AutopilotSettings = () => {
	const { data: settings, isLoading } = useQuery(
		trpc.autopilotSettings.get.queryOptions(),
	);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-48 w-full" />
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	return (
		<div
			className={cn("transition-opacity", {
				"pointer-events-none opacity-60": !settings?.enabled,
			})}
		>
			{settings ? (
				<AutopilotSettingsForm
					defaultValues={settings}
					enabled={settings.enabled}
				/>
			) : null}
		</div>
	);
};
