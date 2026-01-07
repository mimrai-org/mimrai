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

export const InboxOverview = ({
	className,
	inboxId,
}: {
	className?: string;
	inboxId: string;
}) => {
	const { setParams } = useTaskParams();
	const { data } = useQuery(trpc.inbox.getById.queryOptions({ id: inboxId }));
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
					trpc.inbox.getById.queryOptions({ id: inboxId }),
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
					trpc.inbox.getById.queryOptions({ id: inboxId }),
				);
			},
		}),
	);

	useEffect(() => {
		if (data && !data.seen) {
			markAsSeen({ id: data.id, seen: true });
		}
	}, [data]);

	if (!data) {
		return null;
	}

	return (
		<div className={cn(className)}>
			<div className="space-y-4">
				<div className="space-y-1">
					<div className="flex justify-between">
						<h1 className="truncate font-medium text-xl">
							{data.payload.title}
						</h1>
						<div>
							<InboxDropdown inbox={data} />
						</div>
					</div>
					<div className="flex items-center gap-1 text-muted-foreground text-sm">
						<InboxSourceIcon source={data.source} className="size-4" />
						{data.display}
					</div>
				</div>

				<div className="flex items-center gap-2">
					{data.payload.priority &&
						propertiesComponents.priority({
							priority: data.payload.priority,
						})}
					{data.payload.dueDate &&
						propertiesComponents.dueDate({
							dueDate: data.payload.dueDate,
						})}
					{data.assignee && (
						<AssigneeAvatar {...data.assignee} className="size-5" />
					)}
				</div>
				{data.reasoning && (
					<Alert>
						<AlertTitle>Reasoning</AlertTitle>
						<AlertDescription>{data.reasoning}</AlertDescription>
					</Alert>
				)}

				<p className="whitespace-pre-wrap text-sm">
					{data.payload.description || (
						<span className="text-muted-foreground">
							No description provided.
						</span>
					)}
				</p>

				<hr />

				{data.taskId ? (
					<div className="flex justify-end gap-2">
						<Button
							variant="default"
							type="button"
							onClick={() => {
								setParams({
									taskId: data.taskId,
								});
							}}
						>
							<EyeIcon />
							View Task
						</Button>
					</div>
				) : data.status === "pending" ? (
					<div className="flex justify-end gap-2">
						<Button
							variant="default"
							type="button"
							disabled={isAccepting || isDismissing}
							onClick={() =>
								accept({
									id: data.id,
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
									id: data.id,
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
