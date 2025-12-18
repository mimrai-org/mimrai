"use client";
import type { IntegrationName } from "@mimir/integration/registry";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@mimir/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { useIntegrationParams } from "@/hooks/use-integration-params";
import { trpc } from "@/utils/trpc";
import { IntegrationForm } from "../integrations/components";

export const IntegrationInstallSheet = () => {
	const { installType, linkUser, setParams } = useIntegrationParams();

	const isOpen = Boolean(installType);

	const { data: integration } = useQuery(
		trpc.integrations.getByType.queryOptions(
			{ type: installType as IntegrationName },
			{
				enabled: isOpen,
			},
		),
	);

	return (
		<Sheet open={isOpen} onOpenChange={() => setParams(null)}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>{integration?.name} Integration</SheetTitle>
				</SheetHeader>
				{integration && (
					<div className="px-4">
						<IntegrationForm
							type={installType as IntegrationName}
							id={integration.installedIntegration?.id}
							linkUser={Boolean(linkUser)}
						/>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
};
