import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@ui/components/ui/sidebar";
import { LayoutDashboardIcon, ScanIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { CreateButton } from "../create-button";
import { NavPrReviewsItem } from "./nav-pr-reviews-item";

export const NavMainGroup = () => {
	const user = useUser();
	const pathname = usePathname();

	const isOverviewActive = pathname?.startsWith(`${user?.basePath}/overview`);
	const isMyTasksActive = pathname?.startsWith(`${user?.basePath}/my-tasks`);

	return (
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem className="mb-2">
						<CreateButton />
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton asChild isActive={isOverviewActive}>
							<Link href={`${user?.basePath}/overview`}>
								<LayoutDashboardIcon />
								Overview
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton asChild isActive={isMyTasksActive}>
							<Link href={`${user?.basePath}/my-tasks`}>
								<ScanIcon />
								My Tasks
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<NavPrReviewsItem />
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
};
