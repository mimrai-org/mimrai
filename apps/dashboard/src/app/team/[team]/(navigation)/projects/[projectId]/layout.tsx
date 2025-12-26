"use client";

import { Button } from "@ui/components/ui/button";
import { cn } from "@ui/lib/utils";
import { LayersIcon, NotepadText, NotepadTextIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { title } from "process";

type Props = {
	children: React.ReactNode;
};

const nav = [
	{
		title: "Overview",
		href: "detail",
		icon: NotepadTextIcon,
	},
	{
		title: "Updates",
		href: "updates",
		icon: NotepadText,
	},
	{
		title: "Tasks",
		href: "tasks",
		icon: LayersIcon,
	},
];

export default function ProjectLayout({ children }: Props) {
	const pathname = usePathname();
	const currentPath = pathname.split("/").pop();

	return (
		<div>
			<div className="flex gap-2 border-b px-4 py-2">
				{nav.map((item) => {
					const Icon = item.icon;
					return (
						<Link href={item.href} key={item.href}>
							<button
								type="button"
								className={cn(
									"flex items-center gap-1 rounded-sm border px-2 py-1 text-sm transition-colors hover:bg-accent/50",
									{
										"bg-accent text-accent-foreground":
											currentPath === item.href,
									},
								)}
							>
								<Icon className="size-3.5" />
								{item.title}
							</button>
						</Link>
					);
				})}
			</div>
			{children}
		</div>
	);
}
