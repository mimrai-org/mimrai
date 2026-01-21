"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/ui/badge";
import { Button } from "@ui/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/ui/collapsible";
import { cn } from "@ui/lib/utils";
import {
	CheckIcon,
	EyeIcon,
	PlusIcon,
	SparklesIcon,
	XIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTaskParams } from "@/hooks/use-task-params";
import { queryClient, trpc } from "@/utils/trpc";
import { AssigneeAvatar } from "../asignee-avatar";
import Loader from "../loader";
import { propertiesComponents } from "../tasks-view/properties/task-properties-components";
import { InboxDropdown } from "./dropdown";
import { InboxSourceIcon } from "./source-icon";
import { useInbox } from "./use-inbox";

const intakeFilterStatus = ["pending", "accepted"] as const;

export const InboxOverview = ({ className }: { className?: string }) => {
	const { setParams } = useTaskParams();
	const { inboxId, selectedInbox } = useInbox();
	const [intakeStatus, setIntakeStatus] =
		useState<(typeof intakeFilterStatus)[number]>("pending");
	const { data: members } = useQuery(trpc.teams.getMembers.queryOptions());

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
		trpc.intakes.accept.mutationOptions({
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
		trpc.intakes.update.mutationOptions({
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

	const intakesByStatus = useMemo(() => {
		if (!selectedInbox?.intakes) return {};

		const byStatus = (
			selectedInbox?.intakes.filter((intake) => !!intake.id) || []
		).reduce(
			(acc, intake) => {
				if (!acc[intake.status]) {
					acc[intake.status] = [];
				}
				acc[intake.status]!.push(intake);
				return acc;
			},
			{} as Record<string, typeof selectedInbox.intakes>,
		);

		return byStatus;
	}, [selectedInbox]);

	const intakes = intakesByStatus[intakeStatus] || [];

	const intakesAssignees = useMemo(() => {
		if (!selectedInbox || !members) return {};

		const assigneesMap: Record<
			string,
			{ name: string; email: string; image?: string }
		> = {};
		for (const intake of selectedInbox.intakes) {
			if (intake.payload?.assigneeId) {
				const member = members.find((m) => m.id === intake.payload.assigneeId);
				if (member) {
					assigneesMap[intake.payload.assigneeId] = {
						name: member.name,
						email: member.email,
						image: member.image || undefined,
					};
				}
			}
		}
		return assigneesMap;
	}, [selectedInbox, members]);

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
			<div className="h-[calc(100vh-90px)] space-y-4 overflow-y-auto rounded-md border bg-card p-8 dark:border-none">
				<div className="space-y-1">
					<div className="flex justify-between">
						<h1 className="truncate font-header text-3xl">
							{selectedInbox.display}
						</h1>
						<div>
							<InboxDropdown inbox={selectedInbox} />
						</div>
					</div>
					<div className="flex items-center gap-1 text-muted-foreground text-sm">
						<InboxSourceIcon source={selectedInbox.source} className="size-4" />
						{selectedInbox.subtitle || "No additional info"}
					</div>
				</div>

				<div className="text-sm">
					<Collapsible>
						<CollapsibleTrigger className="collapsible-chevron text-muted-foreground text-sm">
							Content
						</CollapsibleTrigger>
						<CollapsibleContent>
							<p className="mt-4 rounded-md border p-4 text-muted-foreground text-sm">
								{selectedInbox.content ?? "No content available."}
							</p>
						</CollapsibleContent>
					</Collapsible>
				</div>

				<div className="flex items-center justify-between gap-2">
					<h3 className="font-medium">Intakes</h3>
					<div className="flex items-center gap-2">
						{intakeFilterStatus.map((status) => (
							<Button
								key={status}
								variant={status === intakeStatus ? "secondary" : "ghost"}
								className="capitalize"
								type="button"
								size="sm"
								onClick={() => {
									setIntakeStatus(status);
								}}
							>
								{status}
								{intakesByStatus[status] &&
									intakesByStatus[status]?.length > 0 && (
										<Badge
											className="ml-1 size-5 rounded-sm"
											variant="secondary"
										>
											{intakesByStatus[status]?.length || 0}
										</Badge>
									)}
							</Button>
						))}
					</div>
				</div>
				{intakes.length === 0 && (
					<p className="rounded-sm border bg-card p-4 text-center text-muted-foreground text-sm dark:border-none">
						No intakes found.
					</p>
				)}

				<div className="space-y-2">
					{intakes.map((intake) => (
						<div
							key={intake.id}
							className="group space-y-2 rounded-sm border p-2 transition-all hover:bg-accent dark:hover:bg-accent/30"
						>
							<div className="flex items-center justify-between gap-2">
								<h2 className="flex items-center gap-1 font-normal text-sm">
									{intake.payload.priority &&
										propertiesComponents.priority({
											priority: intake.payload.priority,
										})}
									{intake.payload.title}
								</h2>

								<div className="flex items-center gap-2">
									{intake.payload.dueDate &&
										propertiesComponents.dueDate({
											dueDate: intake.payload.dueDate,
										})}
									{intake.payload.assigneeId &&
										intakesAssignees[intake.payload.assigneeId] && (
											<AssigneeAvatar
												{...intakesAssignees[intake.payload.assigneeId]}
												className="size-5"
											/>
										)}
								</div>
							</div>

							<div className="flex justify-between gap-4">
								{intake.payload.description && (
									<Collapsible>
										<CollapsibleTrigger className="collapsible-chevron text-muted-foreground text-xs">
											Description
										</CollapsibleTrigger>
										<CollapsibleContent>
											<p className="mt-2 rounded-sm border p-2 text-muted-foreground text-xs">
												<SparklesIcon className="mr-2 inline-block size-3.5" />
												{intake.reasoning}
											</p>
											<p className="p-2 text-sm">
												{intake.payload.description}
											</p>
										</CollapsibleContent>
									</Collapsible>
								)}
							</div>
							<div
								className={cn(
									"overflow-hidden transition-all duration-300 ease-in-out",
									// "max-h-0 group-hover:max-h-40",
									// "opacity-0 group-hover:opacity-100",
								)}
							>
								{intake.taskId ? (
									<div className="flex gap-2">
										<Button
											variant="default"
											type="button"
											size="sm"
											className="h-6 text-xs"
											onClick={() => {
												setParams({
													taskId: intake.taskId,
												});
											}}
										>
											<EyeIcon />
											View Task
										</Button>
									</div>
								) : intake.status === "pending" ? (
									<div className="flex gap-2">
										<Button
											variant="default"
											type="button"
											size="sm"
											className="h-6 text-xs"
											disabled={isAccepting || isDismissing}
											onClick={() =>
												accept({
													id: intake.id,
												})
											}
										>
											{isAccepting ? <Loader /> : <CheckIcon />}
											Accept
										</Button>
										<Button
											variant="ghost"
											type="button"
											size="sm"
											className="h-6 text-xs"
											disabled={isAccepting || isDismissing}
											onClick={() => {
												dismiss({
													id: intake.id,
													status: "dismissed",
												});
											}}
										>
											{isDismissing ? <Loader /> : <XIcon />}
											Dismiss
										</Button>
									</div>
								) : (
									<div />
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
