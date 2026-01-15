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
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-provider";
import { authClient } from "@/lib/auth-client";

export function NavUser() {
	const user = useUser();
	const router = useRouter();
	if (!user) return <div className="size-8 rounded-full bg-secondary/50" />;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<Avatar className="size-8 rounded-full ring-6 ring-secondary/50">
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
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
				side="bottom"
				align="end"
				sideOffset={4}
			>
				<DropdownMenuLabel className="p-0 font-normal">
					<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
						<Avatar className="h-8 w-8 rounded-lg">
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
	);
}
