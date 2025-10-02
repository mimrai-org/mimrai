"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const settingsLinks: {
	to: string;
	label: string;
}[] = [
	{ to: "/dashboard/settings/general", label: "General" },
	{ to: "/dashboard/settings/billing", label: "Billing" },
	{ to: "/dashboard/settings/members", label: "Members" },
	{ to: "/dashboard/settings/integrations", label: "Integrations" },
];

export const SettingsSidebar = () => {
	const pathname = usePathname();

	return (
		<div className="h-full w-full border-r p-4">
			<ul className="flex flex-col space-y-1 text-sm">
				{settingsLinks.map(({ to, label }) => (
					<Link
						href={to}
						key={to}
						className={cn(
							"rounded-md px-4 py-2 hover:bg-accent hover:text-accent-foreground",
							{
								"bg-accent font-medium text-accent-foreground":
									pathname.includes(to),
							},
						)}
					>
						<li>{label}</li>
					</Link>
				))}
			</ul>
		</div>
	);
};
