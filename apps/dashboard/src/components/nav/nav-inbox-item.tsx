import { useQuery } from "@tanstack/react-query";
import {
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@ui/components/ui/sidebar";
import { FolderIcon, InboxIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { trpc } from "@/utils/trpc";
import {
	NavItem,
	NavItemContent,
	NavItemIcon,
	NavItemIconSecondary,
	NavItemIndicator,
	NavItemSubtitle,
	NavItemTitle,
} from "./nav-item";

export const NavInboxItem = () => {
	const user = useUser();
	const pathname = usePathname();
	const { data } = useQuery(trpc.inbox.count.queryOptions());

	return (
		<Link href={`${user?.basePath}/inbox`}>
			<NavItem>
				<NavItemIcon>
					<FolderIcon />
					<NavItemIconSecondary>
						<InboxIcon />
					</NavItemIconSecondary>
					<NavItemIndicator show={!!data}>{data}</NavItemIndicator>
				</NavItemIcon>
				<NavItemContent>
					<NavItemTitle>Inbox</NavItemTitle>
					<NavItemSubtitle>View your inbox</NavItemSubtitle>
				</NavItemContent>
			</NavItem>
		</Link>
	);
};
