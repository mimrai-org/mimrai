import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@ui/components/ui/sidebar";
import { LayersIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { NavProjects } from "./nav-projects";

export const NavWorkspace = () => {
	const user = useUser();
	const pathname = usePathname();

	if (!user) {
		return null;
	}

	const isActive = pathname?.startsWith(`${user?.basePath}/board`);
	const isBacklogActive = pathname?.startsWith(`${user?.basePath}/backlog`);
	const isRecurringActive = pathname?.startsWith(`${user?.basePath}/recurring`);
	const isDoneActive = pathname?.startsWith(`${user?.basePath}/done`);

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Workspace</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton isActive={isActive} asChild>
							<Link href={`${user?.basePath}/board`}>
								<LayersIcon />
								Board
							</Link>
						</SidebarMenuButton>

						<SidebarMenuSub>
							<SidebarMenuSubItem>
								<SidebarMenuSubButton isActive={isBacklogActive} asChild>
									<Link href={`${user?.basePath}/backlog`}>Backlog</Link>
								</SidebarMenuSubButton>
							</SidebarMenuSubItem>
							<SidebarMenuSubItem>
								<SidebarMenuSubButton isActive={isRecurringActive} asChild>
									<Link href={`${user?.basePath}/recurring`}>Recurring</Link>
								</SidebarMenuSubButton>
							</SidebarMenuSubItem>
							<SidebarMenuSubItem>
								<SidebarMenuSubButton isActive={isDoneActive} asChild>
									<Link href={`${user?.basePath}/done`}>Done</Link>
								</SidebarMenuSubButton>
							</SidebarMenuSubItem>
						</SidebarMenuSub>
					</SidebarMenuItem>
					<NavProjects />
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
};
