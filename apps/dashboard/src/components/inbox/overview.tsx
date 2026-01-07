"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@ui/components/ui/alert";
import { Button } from "@ui/components/ui/button";
import { cn } from "@ui/lib/utils";
import { CheckIcon, EyeIcon } from "lucide-react";
import { useEffect } from "react";
import { useTaskParams } from "@/hooks/use-task-params";
import { queryClient, trpc } from "@/utils/trpc";
import { AssigneeAvatar } from "../asignee-avatar";
import Loader from "../loader";
import { propertiesComponents } from "../tasks-view/properties/task-properties-components";
import { InboxDropdown } from "./dropdown";
import { InboxSourceIcon } from "./source-icon";
import { useInbox } from "./use-inbox";

export const InboxOverview = ({ className }: { className?: string }) => {
	const { setParams } = useTaskParams();
	const { inboxId, selectedInbox } = useInbox();

	const { mutate: markAsSeen } = useMutation(
		trpc.inbox.update.mutationOptions({
			onSettled: () => {
				queryClient.setQueryData(
					trpc.inbox.get.infiniteQueryKey({
						status: ["pending"],
					}),
					(oldData) => {
						if (!oldData) return oldData;
						return {
							...oldData,
							pages: oldData.pages.map((page) => ({
								...page,
								data: page.data.map((item) =>
									item.id === inboxId ? { ...item, seen: true } : item,
								),
							})),
						};
					},
				);
			},
		}),
	);

	const { mutate: accept, isPending: isAccepting } = useMutation(
		trpc.inbox.accept.mutationOptions({
			onSettled: () => {
				queryClient.invalidateQueries(
					trpc.inbox.get.infiniteQueryOptions({
						status: ["pending"],
					}),
				);
				queryClient.invalidateQueries(
					trpc.inbox.getById.queryOptions({ id: inboxId! }),
				);
			},
		}),
	);

	const { mutate: dismiss, isPending: isDismissing } = useMutation(
		trpc.inbox.update.mutationOptions({
			onSettled: () => {
				queryClient.invalidateQueries(
					trpc.inbox.get.infiniteQueryOptions({
						status: ["pending"],
					}),
				);
				queryClient.invalidateQueries(
					trpc.inbox.getById.queryOptions({ id: inboxId! }),
				);
			},
		}),
	);

	useEffect(() => {
		if (selectedInbox && !selectedInbox.seen) {
			markAsSeen({ id: selectedInbox.id, seen: true });
		}
	}, [selectedInbox]);

	if (!selectedInbox) {
		return null;
	}

	return (
		<div className={cn("flex-1 p-2")}>
			<div className="h-full space-y-4 rounded-lg bg-card p-4">
				<div className="space-y-1">
					<div className="flex justify-between">
						<h1 className="truncate font-medium text-xl">
							{selectedInbox.payload.title}
						</h1>
						<div>
							<InboxDropdown inbox={selectedInbox} />
						</div>
					</div>
					<div className="flex items-center gap-1 text-muted-foreground text-sm">
						<InboxSourceIcon source={selectedInbox.source} className="size-4" />
						{selectedInbox.display}
					</div>
				</div>

				<div className="flex items-center gap-2">
					{selectedInbox.payload.priority &&
						propertiesComponents.priority({
							priority: selectedInbox.payload.priority,
						})}
					{selectedInbox.payload.dueDate &&
						propertiesComponents.dueDate({
							dueDate: selectedInbox.payload.dueDate,
						})}
					{selectedInbox.assignee && (
						<AssigneeAvatar {...selectedInbox.assignee} className="size-5" />
					)}
				</div>
				{selectedInbox.reasoning && (
					<Alert>
						<AlertTitle>Reasoning</AlertTitle>
						<AlertDescription>{selectedInbox.reasoning}</AlertDescription>
					</Alert>
				)}

				<p className="whitespace-pre-wrap text-sm">
					{selectedInbox.payload.description || (
						<span className="text-muted-foreground">
							No description provided.
						</span>
					)}
				</p>

				<hr />

				{selectedInbox.taskId ? (
					<div className="flex justify-end gap-2">
						<Button
							variant="default"
							type="button"
							onClick={() => {
								setParams({
									taskId: selectedInbox.taskId,
								});
							}}
						>
							<EyeIcon />
							View Task
						</Button>
					</div>
				) : selectedInbox.status === "pending" ? (
					<div className="flex justify-end gap-2">
						<Button
							variant="default"
							type="button"
							disabled={isAccepting || isDismissing}
							onClick={() =>
								accept({
									id: selectedInbox.id,
								})
							}
						>
							{isAccepting ? <Loader /> : <CheckIcon />}
							Accept
						</Button>
						<Button
							variant="ghost"
							type="button"
							disabled={isAccepting || isDismissing}
							onClick={() => {
								dismiss({
									id: selectedInbox.id,
									status: "dismissed",
								});
							}}
						>
							{isDismissing ? <Loader /> : null}
							Dismiss
						</Button>
					</div>
				) : (
					<div />
				)}
			</div>
		</div>
	);
};
