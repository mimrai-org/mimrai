"use client";

import { getContrast } from "@mimir/utils/random";
import { Avatar, AvatarFallback, AvatarImage } from "@ui/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-provider";
import { authClient } from "@/lib/auth-client";
import { AssigneeAvatar } from "./asignee-avatar";

export function NavUser() {
	const user = useUser();
	const router = useRouter();
	if (!user) return <div className="size-8 rounded-full bg-secondary/50" />;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<AssigneeAvatar
					name={user.name}
					email={user.email}
					image={user.image}
					className="size-7"
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
				side="bottom"
				align="end"
				sideOffset={4}
			>
				<DropdownMenuLabel className="p-0 font-normal">
					<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
						<AssigneeAvatar
							name={user.name}
							email={user.email}
							image={user.image}
							className="size-7"
						/>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">{user.name}</span>
							<span className="truncate text-xs">{user.email}</span>
						</div>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />

				<Link href={`${user.basePath}/settings/profile`}>
					<DropdownMenuItem>
						<User />
						Profile
					</DropdownMenuItem>
				</Link>

				<Link href={`${user.basePath}/settings`}>
					<DropdownMenuItem>
						<Settings />
						Settings
					</DropdownMenuItem>
				</Link>

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
	);
}
