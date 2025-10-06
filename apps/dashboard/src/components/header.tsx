"use client";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";
import { TeamSwitcher } from "./team-switcher";
import UserMenu from "./user-menu";

const links: {
	to: string;
	label: string;
	active?: boolean;
}[] = [
	{ to: "/", label: "Home" },
	{ to: "/dashboard", label: "Board" },
	{ to: "/dashboard/settings/general", label: "Settings" },
] as const;

export default function Header() {
	const pathname = usePathname();

	const computedLinks = useMemo(() => {
		return links.map((link) => ({
			...link,
			active: pathname === link.to,
		}));
	}, [pathname]);

	return (
		<header className="">
			<div className="flex h-full flex-col items-start border-b px-8 pt-4">
				<div className="flex w-full items-center justify-between">
					<div className="flex gap-2">
						<div>
							<TeamSwitcher />
						</div>
					</div>
					<div className="flex items-center gap-2">
						<ModeToggle />
						<UserMenu />
					</div>
				</div>
				<nav className="flex items-center gap-4 pt-4 text-sm">
					{computedLinks.map(({ to, label, active }) => {
						return (
							<Link
								key={to}
								href={to}
								className={cn(
									"relative pb-3 opacity-80 transition-all hover:opacity-100",
									{
										"border-primary font-medium opacity-100": active,
										"border-transparent": !active,
									},
								)}
							>
								{label}
								{active && (
									<motion.div
										layout
										layoutId="header-underline"
										className="absolute bottom-0 h-[3px] w-full bg-foreground"
									/>
								)}
							</Link>
						);
					})}
				</nav>
			</div>
		</header>
	);
}
