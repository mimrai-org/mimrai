"use client";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import {
	Command,
	CommandGroup,
	CommandInput,
	CommandList,
} from "@ui/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from "@ui/components/ui/dialog";
import { cn } from "@ui/lib/utils";
import { ArrowDownIcon, ArrowUpIcon, CornerDownLeftIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { useUser } from "@/components/user-provider";
import { trpc } from "@/utils/trpc";
import { GlobalSearchProvider, useGlobalSearch } from "./global-search-context";
import { SearchResultItem } from "./search-result-item";
import type { GlobalSearchItem } from "./types";

const defaultSearchState: GlobalSearchItem[] = [
	{
		id: "action:create-task",
		type: "task",
		title: "Create a new task",
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
		id: "navigate:inbox",
		type: "navigation",
		title: "Inbox",
		teamId: "",
		href: "/inbox",
	},
	{
		id: "navigate:reviews",
		type: "navigation",
		title: "Reviews",
		teamId: "",
		href: "/pr-reviews",
	},
	{
		id: "navigate:settings",
		type: "navigation",
		title: "Settings",
		teamId: "",
		href: "/settings",
	},
	{
		id: "navigate:general",
		type: "navigation",
		title: "General",
		teamId: "",
		href: "/settings/general",
	},
	{
		id: "navigate:profile",
		type: "navigation",
		title: "Profile",
		teamId: "",
		href: "/settings/profile",
	},
	{
		id: "navigate:billing",
		type: "navigation",
		title: "Billing",
		teamId: "",
		href: "/settings/billing",
	},
	{
		id: "navigate:labels",
		type: "navigation",
		title: "Labels",
		teamId: "",
		href: "/settings/labels",
	},
	{
		id: "navigate:members",
		type: "navigation",
		title: "Members",
		teamId: "",
		href: "/settings/members",
	},
	{
		id: "navigate:integrations",
		type: "navigation",
		title: "Integrations",
		teamId: "",
		href: "/settings/integrations",
	},
];

export type GlobalSearchDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelect?: (item: GlobalSearchItem) => void;
	defaultValues?: {
		search?: string;
		type?: string[];
	};
	defaultState?: GlobalSearchItem[];
};

export const GlobalSearchDialog = ({
	open,
	onOpenChange,
	onSelect,
	defaultValues,
	defaultState = defaultSearchState,
}: GlobalSearchDialogProps) => {
	const user = useUser();
	const [search, setSearch] = useState(defaultValues?.search || "");
	const [debouncedSearch] = useDebounceValue(search, 300);

	const { data } = useQuery(
		trpc.globalSearch.search.queryOptions({
			search: debouncedSearch,
			type: defaultValues?.type,
		}),
	);

	const groupedData = useMemo(() => {
		const dataToGroup = data as GlobalSearchItem[] | undefined;
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
				{} as Record<string, GlobalSearchItem[]>,
			) ?? {};

		if (showEmptyState) {
			// slice to avoid too many items when showing empty state
			for (const key in grouped) {
				if (grouped[key]!.length > 1) {
					grouped[key] = grouped[key]!.slice(0, 5);
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
	}, [data, debouncedSearch, defaultState]);

	const handleOpenChange = (isOpen: boolean) => {
		if (!isOpen) {
			setSearch("");
		}
		onOpenChange(isOpen);
	};

	const handleItemOpenChange = useCallback(
		onSelect
			? (open: boolean) => {
					if (!open) {
						// When using custom onSelect, we don't close automatically
					}
				}
			: handleOpenChange,
		[],
	);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				className="h-[calc(100vh-8rem)] p-0 transition-all duration-200 sm:max-w-6xl"
				showCloseButton={false}
			>
				<DialogHeader className="hidden">
					<DialogTitle />
				</DialogHeader>
				<GlobalSearchProvider
					onOpenChange={handleItemOpenChange}
					basePath={user?.basePath || ""}
				>
					<GlobalSearchContent
						search={search}
						setSearch={setSearch}
						groupedData={groupedData}
					/>
				</GlobalSearchProvider>
			</DialogContent>
		</Dialog>
	);
};

const GlobalSearchContent = ({
	search,
	setSearch,
	groupedData,
}: {
	search: string;
	setSearch: (search: string) => void;
	groupedData: Record<string, GlobalSearchItem[]>;
}) => {
	const { preview } = useGlobalSearch();
	const hasPreview = preview !== null;

	return (
		<div className="flex h-full" data-has-preview={hasPreview}>
			<div
				className={cn(
					"flex h-full flex-1 flex-col p-4",
					hasPreview && "border-border border-r",
				)}
			>
				<Command shouldFilter={false} className="h-full bg-transparent">
					<CommandInput
						value={search}
						onValueChange={setSearch}
						containerClassName="h-11"
						placeholder="Search..."
					/>
					<CommandList className="max-h-[calc(100vh-16rem)] overflow-y-auto">
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
										{items?.map((item) => (
											<SearchResultItem key={item.id} item={item} />
										))}
									</CommandGroup>
								);
							})}
					</CommandList>
				</Command>
				<DialogFooter className="mt-auto flex justify-between px-2 pt-2">
					<div />
					<div className="flex items-center gap-4 text-muted-foreground">
						<ArrowDownIcon className="size-4" />
						<ArrowUpIcon className="size-4" />
						<CornerDownLeftIcon className="size-4" />
					</div>
				</DialogFooter>
			</div>
			{hasPreview && (
				<div className="w-xl p-4">
					<div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
						{preview}
					</div>
				</div>
			)}
		</div>
	);
};
