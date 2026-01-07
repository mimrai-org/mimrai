"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/ui/card";
import { queryClient, trpc } from "@/utils/trpc";
import Loader from "../loader";

export const UninstallIntegrationCard = ({
	integrationType,
}: {
	integrationType: string;
}) => {
	const { data: integration, isLoading } = useQuery(
		trpc.integrations.getByType.queryOptions({
			type: integrationType as any,
		}),
	);

	const { mutate: uninstallIntegration, isPending: isUninstalling } =
		useMutation(
			trpc.integrations.uninstall.mutationOptions({
				onSettled: () => {
					queryClient.invalidateQueries(
						trpc.integrations.getByType.queryOptions({
							type: integrationType as any,
						}),
					);
					queryClient.invalidateQueries(trpc.integrations.get.queryOptions());
				},
			}),
		);

	if (!integration || isLoading || !integration.isInstalled) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Uninstall</CardTitle>
				<CardDescription>
					Remove this integration from your team. You can always reinstall it
					later.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button
					variant="destructive"
					onClick={() =>
						uninstallIntegration({
							type: integrationType,
						})
					}
				>
					{isUninstalling ? <Loader /> : ""}
					Uninstall
				</Button>
			</CardContent>
		</Card>
	);
};
