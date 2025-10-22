"use client";
import { t } from "@mimir/locale";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronsUpDownIcon } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { queryClient, trpc } from "@/utils/trpc";

export const NotificationSettingsList = () => {
	const { data } = useQuery(trpc.notificationSettings.getAll.queryOptions());

	const { mutate: updateSetting } = useMutation(
		trpc.notificationSettings.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.notificationSettings.getAll.queryOptions(),
				);
			},
		}),
	);

	const groupedByCategory =
		data?.reduce(
			(acc, setting) => {
				if (!setting.category) {
					setting.category = "General";
				}
				if (!acc[setting.category]) {
					acc[setting.category] = [];
				}
				acc[setting.category]!.push(setting);
				return acc;
			},
			{} as Record<string, typeof data>,
		) ?? {};

	return (
		<Card>
			<CardHeader>
				<CardDescription>
					{t("settings.notifications.description")}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{Object.keys(groupedByCategory).map((category) => {
					const settings = groupedByCategory[category];
					if (!settings) return null;
					return (
						<div key={category}>
							<Collapsible>
								<CollapsibleTrigger className="flex w-full items-center justify-between py-4 text-start font-medium text-base">
									{t(`notifications.categories.${category.toLowerCase()}`)}
									<ChevronsUpDownIcon className="size-4" />
								</CollapsibleTrigger>
								<CollapsibleContent className="border-b">
									<ul>
										{settings.map((setting, i) => (
											<li
												key={i}
												className="flex items-center justify-between border-b py-4 last:border-0"
											>
												<div>
													<span className="text-sm">
														{t(`notifications.types.${setting.type}.title`)}
													</span>
													<p className="text-muted-foreground text-sm">
														{t(
															`notifications.types.${setting.type}.description`,
														)}
													</p>
												</div>

												<div className="flex gap-4">
													{setting.settings.map((option, idx) => (
														<div
															key={idx}
															className="flex flex-col items-center gap-1"
														>
															<label
																htmlFor={`${setting.type}-${option.channel}`}
																className="text-muted-foreground text-sm"
															>
																{t(`notifications.channels.${option.channel}`)}
															</label>
															<Switch
																id={`${setting.type}-${option.channel}`}
																checked={option.enabled}
																onCheckedChange={(value) => {
																	queryClient.setQueryData(
																		trpc.notificationSettings.getAll.queryKey(),
																		(oldData) => {
																			if (!oldData) return oldData;
																			return oldData.map((s) => {
																				if (s.type === setting.type) {
																					return {
																						...s,
																						settings: s.settings.map((opt) => {
																							if (
																								opt.channel === option.channel
																							) {
																								return {
																									...opt,
																									enabled: value,
																								};
																							}
																							return opt;
																						}),
																					};
																				}
																				return s;
																			});
																		},
																	);
																	updateSetting({
																		channel: option.channel,
																		enabled: value,
																		notificationType: setting.type,
																	});
																}}
															/>
														</div>
													))}
												</div>
											</li>
										))}
									</ul>
								</CollapsibleContent>
							</Collapsible>
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
};
