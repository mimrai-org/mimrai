import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@ui/components/ui/sidebar";
import { cn } from "@ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";
import { useUser } from "@/hooks/use-user";
import type { NavItem } from "./app-sidebar";

export function NavSecondary({
	items,
	...props
}: {
	items: NavItem[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
	const pathname = usePathname();
	const user = useUser();

	const addTeamToUrl = (url: string) => {
		if (url.includes("{team}")) {
			return url.replace("{team}", user?.team?.slug || "");
		}
		return url;
	};

	return (
		<SidebarGroup {...props}>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => {
						if ("title" in item === false) return null;

						const isActive = pathname.startsWith(addTeamToUrl(item.url));

						return (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton asChild size="sm">
									<Link
										href={addTeamToUrl(item.url)}
										className={cn(
											"flex h-8 items-center border border-transparent text-sm!",
											{
												"bg-accent": isActive,
											},
										)}
									>
										<item.icon className="size-4! text-muted-foreground" />
										<span>{item.title}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						);
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
