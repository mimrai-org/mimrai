"use client";
import type { IntegrationName } from "@mimir/api/integrations/registry";
import { useQuery } from "@tanstack/react-query";
import { useIntegrationParams } from "@/hooks/use-integration-params";
import { trpc } from "@/utils/trpc";
import { IntegrationConfigForm } from "../forms/integration-config-form";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";

export const IntegrationInstallSheet = () => {
	const { installType, setParams } = useIntegrationParams();

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
					<IntegrationConfigForm type={installType as IntegrationName} />
				)}
			</SheetContent>
		</Sheet>
	);
};
