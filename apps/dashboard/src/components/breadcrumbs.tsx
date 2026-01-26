"use client";
import { Button } from "@ui/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { cn } from "@ui/lib/utils";
import {
	ChevronDown,
	FolderCogIcon,
	FoldersIcon,
	GitPullRequestIcon,
	HomeIcon,
	InboxIcon,
	SlashIcon,
} from "lucide-react";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { getSession } from "@/lib/get-session";
import { TeamSwitcher } from "./team-switcher";

interface BreadcrumpItem {
	label: string;
	segments: string[];
	customElement?: React.ReactNode;
	icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	items?: { label: string; segments: string[] }[];
}

const breadcrumpsMap: BreadcrumpItem[] = [
	{ icon: HomeIcon, label: "Home", segments: [] },
	{
		icon: FoldersIcon,
		label: "Projects",
		segments: ["projects"],
	},
	{
		icon: FolderCogIcon,
		label: "Settings",
		segments: ["settings"],
	},
	{
		icon: GitPullRequestIcon,
		label: "Reviews",
		segments: ["pr-reviews"],
	},
	{
		icon: InboxIcon,
		label: "Inbox",
		segments: ["inbox"],
	},
	{
		label: "General",
		segments: ["settings", "general"],
	},
	{
		label: "Profile",
		segments: ["settings", "profile"],
	},
	{
		label: "Billing",
		segments: ["settings", "billing"],
	},
	{
		label: "Members",
		segments: ["settings", "members"],
	},
	{
		label: "Labels",
		segments: ["settings", "labels"],
	},
	{
		label: "Statuses",
		segments: ["settings", "statuses"],
	},
	{
		label: "Integrations",
		segments: ["settings", "integrations"],
	},
	{
		label: "Autopilot",
		segments: ["settings", "autopilot"],
	},
	{
		label: "Notifications",
		segments: ["settings", "notifications"],
	},
	{
		label: "Zen Mode",
		segments: ["settings", "zen"],
	},
];

interface BreadcrumbsContextValue {
	setCrumb: (crumb: BreadcrumpItem) => void;
	crumbs: BreadcrumpItem[];
	basePath: string;
}

const BreadcrumbsContext = createContext<BreadcrumbsContextValue | undefined>(
	undefined,
);

export const BreadcrumbsProvider = ({
	children,
	session,
}: {
	children: React.ReactNode;
	session: Awaited<ReturnType<typeof getSession>>;
}) => {
	const basePath = `/team/${session?.user?.teamSlug || ""}`;
	const segments = useSelectedLayoutSegments();
	const [overrideCrumbs, setOverrideCrumbs] = useState<BreadcrumpItem[]>([
		{
			segments: [],
			label: "Home",
			customElement: <TeamSwitcher />,
		},
	]);

	const crumbs = useMemo(() => {
		const map: BreadcrumpItem[] = [...overrideCrumbs, ...breadcrumpsMap];
		const filteredSegments = segments.filter((seg) => !seg.match(/^\(.*\)$/));

		const result: BreadcrumpItem[] = [];

		for (let i = 0; i <= filteredSegments.length; i++) {
			const segmentSlice = filteredSegments.slice(0, i);
			const match = map.find(
				(crumb) =>
					crumb.segments.length === segmentSlice.length &&
					crumb.segments.every((seg, index) => seg === segmentSlice[index]),
			);

			if (match) {
				result.push(match);
			} else {
				const label = segmentSlice[segmentSlice.length - 1];

				// prevent adding uuids or dynamic segments
				if (label?.match(/^[0-9a-fA-F-]{36}$/)) {
					continue;
				}

				result.push({
					segments: segmentSlice,
					label: segmentSlice[segmentSlice.length - 1] || "Home",
				});
			}
		}

		return result;
	}, [segments, overrideCrumbs]);

	const setCrumb = useCallback((crumb: BreadcrumpItem) => {
		setOverrideCrumbs((prev) => {
			const exists = prev.find(
				(c) =>
					c.segments.length >= crumb.segments.length &&
					c.segments.every((seg, i) => seg === crumb.segments[i]),
			);
			if (exists) return prev;
			return [...prev, crumb];
		});
	}, []);

	const contextValue = useMemo(
		() => ({ setCrumb, crumbs, basePath }),
		[setCrumb, crumbs, basePath],
	);

	return (
		<BreadcrumbsContext.Provider value={contextValue}>
			{children}
		</BreadcrumbsContext.Provider>
	);
};

export const useBreadcrumbs = () => {
	const context = useContext(BreadcrumbsContext);
	if (!context) {
		throw new Error("useBreadcrumbs must be used within a BreadcrumbsProvider");
	}
	return context;
};

export const Breadcrumbs = () => {
	const { crumbs, basePath } = useBreadcrumbs();

	return (
		<div className="flex items-center">
			{crumbs.map((crumb, index) => {
				if (crumb.customElement) {
					return (
						<div key={index} className="flex items-center">
							{crumb.customElement}
							{index < crumbs.length - 1 && (
								<SlashIcon className="-rotate-16 size-3.5 text-muted-foreground" />
							)}
						</div>
					);
				}

				return (
					<div key={index} className="flex items-center">
						{crumb.items ? (
							<DropdownMenu>
								<Button
									variant="ghost"
									className={cn("px-2!", {
										"font-medium text-foreground": index === crumbs.length - 1,
										"font-normal text-muted-foreground":
											index < crumbs.length - 1,
									})}
									size="sm"
								>
									<Link
										href={`${basePath}/${crumb.segments.join("/")}`}
										className="flex items-center gap-2 capitalize"
									>
										{crumb.icon && <crumb.icon className="mr-1 size-4" />}
										<span className="max-w-48 truncate">{crumb.label}</span>
									</Link>
									<DropdownMenuTrigger asChild>
										<div>
											<ChevronDown className="size-4 text-muted-foreground" />
										</div>
									</DropdownMenuTrigger>
								</Button>
								<DropdownMenuContent>
									{crumb.items?.map((item, itemIndex) => (
										<Link
											key={itemIndex}
											href={`${basePath}/${item.segments.join("/")}`}
										>
											<DropdownMenuItem>{item.label}</DropdownMenuItem>
										</Link>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
						) : (
							<Link href={`${basePath}/${crumb.segments.join("/")}`}>
								<Button
									variant="ghost"
									className={cn("px-2! capitalize", {
										"font-medium text-foreground": index === crumbs.length - 1,
										"font-normal text-muted-foreground":
											index < crumbs.length - 1,
									})}
									size="sm"
								>
									{crumb.icon && <crumb.icon className="mr-1 size-4" />}
									<span className="max-w-48 truncate">{crumb.label}</span>
								</Button>
							</Link>
						)}
						{index < crumbs.length - 1 && (
							<SlashIcon className="-rotate-16 size-3.5 text-muted-foreground" />
						)}
					</div>
				);
			})}
		</div>
	);
};

export const useSetBreadcrumbs = (
	payload: BreadcrumpItem[],
	options: {
		enabled?: boolean;
	} = {
		enabled: true,
	},
) => {
	const { enabled } = options;
	const { setCrumb } = useBreadcrumbs();
	useEffect(() => {
		if (!enabled) return;
		for (const crumb of payload) {
			if (crumb.label) setCrumb(crumb);
		}
	}, [payload, setCrumb, enabled]);
};

export const BreadcrumbSetter = ({ crumbs }: { crumbs: BreadcrumpItem[] }) => {
	useSetBreadcrumbs(crumbs);
	return <>{null}</>;
};
