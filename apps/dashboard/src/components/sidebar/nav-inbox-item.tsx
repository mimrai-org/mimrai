import { useQuery } from "@tanstack/react-query";
import {
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@ui/components/ui/sidebar";
import { InboxIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { trpc } from "@/utils/trpc";

export const NavInboxItem = () => {
	const user = useUser();
	const pathname = usePathname();
	const { data } = useQuery(trpc.inbox.count.queryOptions());

	return (
		<SidebarMenuItem>
			<SidebarMenuButton asChild isActive={pathname?.includes("/inbox")}>
				<Link href={`${user?.basePath}/inbox`}>
					<InboxIcon />
					Inbox
				</Link>
			</SidebarMenuButton>
			<SidebarMenuBadge>{data || null}</SidebarMenuBadge>
		</SidebarMenuItem>
	);
};
