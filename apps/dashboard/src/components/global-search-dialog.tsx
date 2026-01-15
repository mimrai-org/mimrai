"use client";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import {
	Command,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@ui/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from "@ui/components/ui/dialog";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	BoxIcon,
	ChevronRight,
	CornerDownLeftIcon,
	LayersIcon,
	TargetIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { useUser } from "@/components/user-provider";
import { useProjectParams } from "@/hooks/use-project-params";
import { useTaskParams } from "@/hooks/use-task-params";
import { trpc } from "@/utils/trpc";

export type GlobalSearchItem = {
	id: string;
	type: string;
	title: string;
	color?: string;
	parentId?: string | null;
	href?: string;
	teamId: string;
};

const defaultSearchState: GlobalSearchItem[] = [
	{
		id: "action:create-task",
		type: "task",
		title: "Create a new task",
		teamId: "",
	},
	{
		id: "action:view-board",
		type: "task",
		title: "View board",
		teamId: "",
	},
	{
		id: "action:create-project",
		type: "project",
		title: "Create a new project",
		teamId: "",
	},
	{
		id: "action:view-projects",
		type: "project",
		title: "View all projects",
		teamId: "",
	},
	{
		id: "action:navigate:inbox",
		type: "navigation",
		title: "Inbox",
		teamId: "",
		href: "/inbox",
	},
	{
		id: "action:navigate:reviews",
		type: "navigation",
		title: "Reviews",
		teamId: "",
		href: "/pr-reviews",
	},
	{
		id: "action:navigate:settings",
		type: "navigation",
		title: "Settings",
		teamId: "",
		href: "/settings",
	},
	{
		id: "action:navigate:general",
		type: "navigation",
		title: "General",
		teamId: "",
		href: "/settings/general",
	},
	{
		id: "action:navigate:profile",
		type: "navigation",
		title: "Profile",
		teamId: "",
		href: "/settings/profile",
	},
	{
		id: "action:navigate:billing",
		type: "navigation",
		title: "Billing",
		teamId: "",
		href: "/settings/billing",
	},
	{
		id: "action:navigate:members",
		type: "navigation",
		title: "Members",
		teamId: "",
		href: "/settings/members",
	},
	{
		id: "action:navigate:integrations",
		type: "navigation",
		title: "Integrations",
		teamId: "",
		href: "/settings/integrations",
	},
];

export const GlobalSearchDialog = ({
	open,
	onOpenChange,
	onSelect,
	defaultValues,
	defaultState = defaultSearchState,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelect?: (item: GlobalSearchItem) => void;
	defaultValues?: {
		search?: string;
		type?: string[];
	};
	defaultState?: GlobalSearchItem[];
}) => {
	const router = useRouter();
	const user = useUser();
	const [search, setSearch] = useState(defaultValues?.search || "");
	const [debouncedSearch] = useDebounceValue(search, 300);
	const { setParams: setTaskParams } = useTaskParams();
	const { setParams: setProjectParams } = useProjectParams();

	const { data } = useQuery(
		trpc.globalSearch.search.queryOptions({
			search: debouncedSearch,
			type: defaultValues?.type,
		}),
	);

	const groupedData = useMemo(() => {
		const dataToGroup = data;
		const showEmptyState =
			defaultState && defaultState.length > 0 && debouncedSearch.length === 0;

		const grouped =
			dataToGroup?.reduce(
				(acc, item) => {
					if (!acc[item.type]) {
						acc[item.type] = [];
					}
					acc[item.type]!.push(item);
					return acc;
				},
				{} as Record<string, typeof data>,
			) ?? {};

		if (showEmptyState) {
			// slice to avoid too many items when showing empty state
			for (const key in grouped) {
				if (grouped[key]!.length > 1) {
					grouped[key] = grouped[key]!.slice(0, 1);
				}
			}
		}

		for (const item of defaultState) {
			// Fill missing types with default state items
			if (!grouped?.[item.type]) {
				grouped![item.type] = [];
			}

			if (showEmptyState) {
				// include all default state items if no search is applied
				grouped[item.type]!.push(item);
			} else {
				// include default state items that match the search
				const shouldInclude = item.title
					.toLowerCase()
					.includes(debouncedSearch.toLowerCase());
				if (shouldInclude) grouped[item.type]?.push(item);
			}
		}

		return grouped;
	}, [data, debouncedSearch.length, defaultState]);

	const handleOpenChange = (isOpen: boolean) => {
		if (!isOpen) {
			setSearch("");
		}
		onOpenChange(isOpen);
	};

	const handleSelect = (item: {
		id: string;
		type: string;
		parentId?: string | null;
		href?: string;
	}) => {
		if (onSelect) {
			onSelect(item as GlobalSearchItem);
			return;
		}
		const isAction = item.id === "action" || item.id.startsWith("action:");

		if (isAction) {
			switch (item.id) {
				case "action:view-board": {
					// navigate to board view
					router.push(`${user?.basePath}/board`);
					return;
				}
				case "action:view-projects": {
					// navigate to projects view
					router.push(`${user?.basePath}/projects`);
					return;
				}
				case "action:create-task": {
					// navigate to create task
					setTaskParams({ createTask: true });
					return;
				}
				case "action:create-project": {
					// navigate to create project
					setProjectParams({ createProject: true });
					return;
				}
				default:
					break;
			}
		}

		switch (item.type) {
			case "task": {
				// navigate to task
				setTaskParams({ taskId: item.id });
				break;
			}
			case "project": {
				// navigate to project
				router.push(`${user?.basePath}/projects/${item.id}/detail`);
				break;
			}
			case "milestone": {
				// navigate to milestone
				router.push(
					`${user?.basePath}/projects/${item.parentId}/tasks?mId=${item.id}`,
				);
				break;
			}
			case "navigation": {
				if (item.href) {
					// navigate to href
					router.push(`${user?.basePath}${item.href}`);
				}
				break;
			}
			default:
				break;
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="p-4" showCloseButton={false}>
				<DialogHeader className="hidden">
					<DialogTitle />
				</DialogHeader>
				<Command shouldFilter={false} className="bg-transparent">
					<CommandInput
						value={search}
						onValueChange={setSearch}
						containerClassName="h-11"
						placeholder="Search..."
					/>
					<CommandList>
						{groupedData &&
							Object.entries(groupedData).map(([type, items]) => {
								if (!items || items.length === 0) {
									return null;
								}
								return (
									<CommandGroup
										key={type}
										heading={type}
										className="[&_[cmdk-group-heading]]:capitalize"
									>
										{items?.map((item) => {
											let Icon =
												searchIcons[item.type as keyof typeof searchIcons];
											const isAction =
												item.id === "action" || item.id.startsWith("action:");

											if (isAction) {
												Icon = CornerDownLeftIcon;
											}
											return (
												<CommandItem
													key={item.id}
													className="group flex w-full cursor-pointer items-center rounded-sm px-4 py-2 text-sm transition-colors duration-200 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/30"
													onSelect={() => {
														// @ts-expect-error -- type matches
														handleSelect(item);
														onOpenChange(false);
													}}
												>
													<Icon
														className="mr-2 size-4 text-muted-foreground"
														style={{
															color: item.color || "inherit",
														}}
													/>
													{item.title}
													<div className="ml-auto inline opacity-0 transition-opacity duration-200 group-hover:opacity-100">
														<ChevronRight className="size-4 text-muted-foreground" />
													</div>
												</CommandItem>
											);
										})}
									</CommandGroup>
								);
							})}
					</CommandList>
				</Command>
				<DialogFooter className="flex justify-between px-2">
					<div />
					<div className="flex items-center gap-4 text-muted-foreground">
						<ArrowDownIcon className="size-4" />
						<ArrowUpIcon className="size-4" />
						<CornerDownLeftIcon className="size-4" />
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

const searchIcons = {
	task: LayersIcon,
	project: BoxIcon,
	milestone: TargetIcon,
};
