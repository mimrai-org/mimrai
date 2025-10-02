"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIntegrationParams } from "@/hooks/use-integration-params";
import { trpc } from "@/utils/trpc";

export const IntegrationsList = () => {
	const { setParams } = useIntegrationParams();
	const { data } = useQuery(trpc.integrations.get.queryOptions());

	return (
		<Card>
			<CardHeader>
				<CardTitle>Integrations</CardTitle>
			</CardHeader>
			<CardContent>
				<ul>
					{data?.map((integration) => (
						<li
							key={integration.name}
							className="flex items-center justify-between text-sm"
						>
							<div>
								<span>{integration.name}</span>
								<p className="text-muted-foreground text-xs">
									{integration.description}
								</p>
							</div>
							<div>
								{integration.isInstalled ? (
									<div className="flex items-center gap-4">
										<span className="text-muted-foreground">Installed</span>
										<Link
											href={`/dashboard/settings/integrations/${integration.id}`}
										>
											<Button size={"sm"} variant="outline">
												Configure
											</Button>
										</Link>
									</div>
								) : (
									<Button
										size={"sm"}
										onClick={() => setParams({ installType: integration.type })}
									>
										Install
									</Button>
								)}
							</div>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
};
