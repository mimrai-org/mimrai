"use client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { Checkbox } from "@ui/components/ui/checkbox";
import { Input } from "@ui/components/ui/input";
import { cn } from "@ui/lib/utils";
import { FolderIcon, SquareCheckIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useDebounceCallback } from "usehooks-ts";
import { useNotificationFilterParams } from "@/hooks/use-notification-filter-params";
import { queryClient, trpc } from "@/utils/trpc";
import { useNotificationStore } from "./store";

export const NotificationHeader = () => {
	const { selectedIds, toggleSelection, clearSelection } =
		useNotificationStore();
	const { setParams, ...params } = useNotificationFilterParams();

	const [search, setSearch] = useState("");
	const debouncedSetParams = useDebounceCallback(setParams, 400);

	const selectedCount = Array.from(selectedIds.values()).filter(Boolean).length;

	const { mutate: bulkUpdate } = useMutation(
		trpc.activities.bulkUpdate.mutationOptions({
			onMutate: () => {
				toast.loading("Updating notifications...", {
					id: "bulk-update-notifications",
				});
			},
			onSuccess: () => {
				toast.success("Notifications updated", {
					id: "bulk-update-notifications",
				});
				queryClient.invalidateQueries(
					trpc.activities.get.infiniteQueryOptions({
						onlyForUser: true,
					}),
				);
				clearSelection();
			},
			onError: (error) => {
				toast.error("Error updating notifications", {
					id: "bulk-update-notifications",
				});
			},
		}),
	);

	useEffect(() => {
		debouncedSetParams({ ...params, search });
	}, [search]);

	return (
		<div>
			<div className="flex items-center justify-between px-4">
				<div className="flex items-center gap-4">
					<Checkbox
						checked={
							selectedCount === 0
								? false
								: selectedCount === selectedIds.size
									? true
									: "indeterminate"
						}
						onCheckedChange={(checked) => {
							for (const itemId of selectedIds) {
								toggleSelection(itemId[0], checked as boolean);
							}
						}}
					/>
					<Input
						value={search ?? ""}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search..."
						className="w-fit"
					/>
				</div>

				<div className="flex items-center gap-2">
					<AnimatePresence mode="wait">
						{selectedCount > 0 && (
							<motion.div
								initial={{ opacity: 0, translateY: 5 }}
								animate={{ opacity: 1, translateY: 0 }}
								exit={{ opacity: 0, translateY: 5 }}
								transition={{ duration: 0.2 }}
								className="flex items-center gap-2"
							>
								<span className="text-muted-foreground text-sm">
									<span className="font-mono">{selectedCount}</span> selected
								</span>
								<Button
									variant="secondary"
									size="sm"
									onClick={() => {
										bulkUpdate({
											ids: Array.from(selectedIds.entries())
												.filter(([_, v]) => v)
												.map(([k, _]) => k),
											status: "read",
										});
									}}
								>
									<SquareCheckIcon />
									Mark as read
								</Button>
								<Button
									variant="secondary"
									size="sm"
									onClick={() => {
										bulkUpdate({
											ids: Array.from(selectedIds.entries())
												.filter(([_, v]) => v)
												.map(([k, _]) => k),
											status: "archived",
										});
									}}
								>
									<FolderIcon />
									Archive
								</Button>
							</motion.div>
						)}
					</AnimatePresence>
					<div className="flex items-center divide-x border">
						<Tab
							active={Boolean(params.status?.includes("archived"))}
							label="Archived"
							onClick={() => {
								setParams({
									...params,
									status: params.status?.includes("archived")
										? null
										: ["archived"],
								});
							}}
						/>
						<Tab
							active={Boolean(params.status?.includes("unread"))}
							label="Unread"
							onClick={() => {
								setParams({
									...params,
									status: params.status?.includes("unread") ? null : ["unread"],
								});
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

const Tab = ({
	label,
	active,
	onClick,
}: {
	label: string;
	active: boolean;
	onClick: () => void;
}) => {
	return (
		<button
			type="button"
			className={cn("h-8 px-4 text-sm transition-colors", {
				"bg-primary text-primary-foreground": active,
			})}
			onClick={onClick}
		>
			{label}
		</button>
	);
};
