"use client";

import { t } from "@mimir/locale";
import { Button } from "@mimir/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@mimir/ui/card";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { IntegrationIcon } from "@/components/integrations/integration-icon";
import { useUser } from "@/components/user-provider";
import { useIntegrationParams } from "@/hooks/use-integration-params";
import { useScopes } from "@/hooks/use-scopes";
import { getSlackInstallUrl } from "@/lib/integrations";
import { trpc } from "@/utils/trpc";

export const IntegrationsList = () => {
	const user = useUser();
	const { setParams } = useIntegrationParams();
	const { data } = useQuery(trpc.integrations.get.queryOptions());
	const canWriteTeam = useScopes(["team:write"]);

	return (
		<Card className="border-0">
			<CardHeader>
				<CardTitle>{t("settings.integrations.title")}</CardTitle>
				<CardDescription>
					Install and manage integrations to enhance your team's workflow.
				</CardDescription>
			</CardHeader>
			<CardContent className="border-0 p-0">
				<ul className="grid grid-cols-3 gap-4">
					{data?.map((integration) => (
						<li
							key={integration.name}
							className="flex flex-col justify-between gap-4 rounded-md border p-4 text-sm"
						>
							<div className="space-y-4">
								<IntegrationIcon type={integration.type} />
								<div>
									<h3>{integration.name}</h3>
									<p className="text-muted-foreground text-xs">
										{integration.description}
									</p>
								</div>
							</div>
							<div className="flex items-center justify-end">
								<div>
									{integration.isInstalledOnTeam ? (
										integration.isInstalledOnUser ? (
											<div className="flex items-center gap-4">
												<span className="text-muted-foreground">Installed</span>
												<Link
													href={`${user?.basePath}/settings/integrations/${integration.type}`}
												>
													<Button size={"sm"} variant="outline">
														Configure
													</Button>
												</Link>
											</div>
										) : (
											<Button
												size={"sm"}
												onClick={() =>
													setParams({
														installType: integration.type,
														linkUser: true,
													})
												}
											>
												Link Account
											</Button>
										)
									) : integration.type === "whatsapp" ? (
										<Link target="_blank" href={"https://wa.me/+18634347933"}>
											<Button size="sm" variant={"outline"}>
												Chat
											</Button>
										</Link>
									) : integration.type === "slack" && canWriteTeam ? (
										<Link href={getSlackInstallUrl()} target="_blank">
											<Button size="sm">Install</Button>
										</Link>
									) : canWriteTeam ? (
										<Button
											size={"sm"}
											onClick={() =>
												setParams({ installType: integration.type })
											}
										>
											Install
										</Button>
									) : null}
								</div>
							</div>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
};
