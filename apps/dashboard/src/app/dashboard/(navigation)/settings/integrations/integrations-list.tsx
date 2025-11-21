"use client";

import { t } from "@mimir/locale";
import { Button } from "@mimir/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@mimir/ui/card";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useIntegrationParams } from "@/hooks/use-integration-params";
import { useScopes } from "@/hooks/use-user";
import { getSlackInstallUrl } from "@/lib/integrations";
import { trpc } from "@/utils/trpc";

export const IntegrationsList = () => {
	const { setParams } = useIntegrationParams();
	const { data } = useQuery(trpc.integrations.get.queryOptions());
	const canWriteTeam = useScopes(["team:write"]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("settings.integrations.title")}</CardTitle>
			</CardHeader>
			<CardContent>
				<ul>
					{data?.map((integration) => (
						<li
							key={integration.name}
							className="flex items-center justify-between border-b py-4 text-sm last:border-0"
						>
							<div>
								<span>{integration.name}</span>
								<p className="text-muted-foreground text-xs">
									{integration.description}
								</p>
							</div>
							<div>
								{canWriteTeam && (
									<div>
										{integration.isInstalled ? (
											<div className="flex items-center gap-4">
												<span className="text-muted-foreground">Installed</span>
												<Link
													href={`/dashboard/settings/integrations/${integration.type}`}
												>
													<Button size={"sm"} variant="outline">
														Configure
													</Button>
												</Link>
											</div>
										) : integration.type === "whatsapp" ? (
											<Link target="_blank" href={"https://wa.me/+18634347933"}>
												<Button size="sm" variant={"outline"}>
													Chat
												</Button>
											</Link>
										) : integration.type === "slack" ? (
											<Link href={getSlackInstallUrl()} target="_blank">
												<Button size="sm">Install</Button>
											</Link>
										) : (
											<Button
												size={"sm"}
												onClick={() =>
													setParams({ installType: integration.type })
												}
											>
												{integration.type === "gmail" ? "Connect" : "Install"}
											</Button>
										)}
									</div>
								)}
							</div>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
};
