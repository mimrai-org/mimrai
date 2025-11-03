"use client";

import { getContrast } from "@mimir/utils/random";
import { Avatar, AvatarFallback, AvatarImage } from "@ui/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@ui/components/ui/sidebar";
import {
	BadgeCheck,
	Bell,
	ChevronsUpDown,
	CreditCard,
	LogOut,
	Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function NavUser({
	user,
}: {
	user?: {
		name?: string;
		email?: string | null;
		image?: string | null;
		color?: string | null;
	};
}) {
	const router = useRouter();
	const { isMobile } = useSidebar();
	if (!user) return null;
	console.log(user);

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							// className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							className="flex items-center border border-transparent py-2 hover:border-input"
						>
							<Avatar className="h-8 w-8 rounded-none border border-primary">
								<AvatarImage src={user.image!} alt={user.name} />
								<AvatarFallback
									className="rounded-none"
									style={{
										backgroundColor: user.color ?? "var(--primary)",
										color: user.color
											? getContrast(user.color)
											: "var(--primary-foreground)",
									}}
								>
									{user.name
										?.split(" ")
										.slice(0, 2)
										.map((n) => n[0])
										.join("")
										.toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{user.name}</span>
								<span className="truncate text-xs">{user.email}</span>
							</div>
							<ChevronsUpDown className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-none border border-primary">
									<AvatarImage src={user.image!} alt={user.name} />
									<AvatarFallback
										className="rounded-none"
										style={{
											backgroundColor: user.color ?? "var(--primary)",
											color: user.color
												? getContrast(user.color)
												: "var(--primary-foreground)",
										}}
									>
										{user.name
											?.split(" ")
											.slice(0, 2)
											.map((n) => n[0])
											.join("")
											.toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{user.name}</span>
									<span className="truncate text-xs">{user.email}</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />

						<DropdownMenuItem
							onClick={() => {
								authClient.signOut({
									fetchOptions: {
										onSuccess: () => {
											router.push("/");
										},
									},
								});
							}}
						>
							<LogOut />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
