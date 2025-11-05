"use client";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@ui/components/ui/sidebar";
import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import { CreateButton } from "./create-button";

export function NavMain({
	items,
}: {
	items: {
		title: string;
		url: string;
		icon: LucideIcon;
		scopes?: string[];
		items?: {
			title: string;
			url: string;
			scopes?: string[];
		}[];
	}[];
}) {
	const user = useUser();
	const pathname = usePathname();

	return (
		<SidebarGroup className="pt-6">
			<SidebarMenu>
				<SidebarMenuItem className="mb-2">
					<CreateButton />
				</SidebarMenuItem>
				{items.map((item) => {
					const isActive =
						pathname.startsWith(item.url) ||
						item.items?.some((subItem) => pathname.startsWith(subItem.url));

					if (
						item.scopes &&
						!item.scopes.every((scope) =>
							(user?.team?.scopes as string[])?.includes(scope),
						)
					)
						return null;
					return (
						<Collapsible key={item.title} asChild defaultOpen={isActive}>
							<SidebarMenuItem>
								<SidebarMenuButton asChild tooltip={item.title}>
									<Link
										href={item.url}
										className={cn(
											"flex items-center border border-transparent py-5 text-sm! hover:border-input",
											{
												"border-input bg-accent": isActive,
											},
										)}
									>
										<item.icon className="size-4!" />
										<span>{item.title}</span>
									</Link>
								</SidebarMenuButton>
								{item.items?.length ? (
									<>
										<CollapsibleTrigger asChild>
											<SidebarMenuAction className="mt-1 hover:bg-transparent data-[state=open]:rotate-90">
												<ChevronRight />
												<span className="sr-only">Toggle</span>
											</SidebarMenuAction>
										</CollapsibleTrigger>
										<CollapsibleContent>
											<SidebarMenuSub>
												{item.items?.map((subItem) => {
													const isSubActive = pathname.startsWith(subItem.url);

													if (
														subItem.scopes &&
														!subItem.scopes.every((scope) =>
															(user?.team?.scopes as string[])?.includes(scope),
														)
													)
														return null;
													return (
														<SidebarMenuSubItem key={subItem.title}>
															<SidebarMenuSubButton
																asChild
																className={cn(
																	"text-muted-foreground hover:bg-transparent focus-visible:bg-transparent",
																	{
																		"text-accent-foreground": isSubActive,
																	},
																)}
															>
																<Link href={subItem.url}>
																	<span>{subItem.title}</span>
																</Link>
															</SidebarMenuSubButton>
														</SidebarMenuSubItem>
													);
												})}
											</SidebarMenuSub>
										</CollapsibleContent>
									</>
								) : null}
							</SidebarMenuItem>
						</Collapsible>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}
