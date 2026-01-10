"use client";

import type { RouterOutputs } from "@mimir/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { formatRelative } from "date-fns";
import {
	CheckIcon,
	EllipsisVerticalIcon,
	GaugeCircleIcon,
	HistoryIcon,
	PencilIcon,
	TrashIcon,
} from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { AssigneeAvatar } from "@/components/asignee-avatar";
import {
	ProjectHealthIcon,
	ProjectHealthLabel,
} from "@/components/forms/project-health-update-form/project-health-icon";
import Loader from "@/components/loader";
import { useProjectHealthUpdateParams } from "@/hooks/use-project-health-update-params";
import { trpc } from "@/utils/trpc";
import { Response } from "../../chat/response";

type HealthUpdate =
	RouterOutputs["projectHealthUpdates"]["get"]["data"][number];
type HealthUpdateWithDiff = HealthUpdate & {
	diff: {
		completed: number;
		open: number;
		total: number;
	};
};

export const ProjectHealthUpdatesTimeline = ({
	projectId,
}: {
	projectId: string;
}) => {
	const { data, isLoading } = useQuery(
		trpc.projectHealthUpdates.get.queryOptions({ projectId }),
	);

	const withDiff = useMemo<HealthUpdateWithDiff[]>(() => {
		if (!data) return [];

		const clone = [...data.data].reverse();

		return clone
			.map((update, index) => {
				const prev = clone[index - 1];
				const newUpdate = { ...update };
				if (!prev)
					return {
						...newUpdate,
						diff: {
							completed: newUpdate.snapshot.progress.tasks.completed,
							open: newUpdate.snapshot.progress.tasks.open,
							total: newUpdate.snapshot.progress.tasks.total,
						},
					};
				return {
					...newUpdate,
					diff: {
						completed:
							newUpdate.snapshot.progress.tasks.completed -
							prev.snapshot.progress.tasks.completed,
						open:
							newUpdate.snapshot.progress.tasks.open -
							prev.snapshot.progress.tasks.open,
						total:
							newUpdate.snapshot.progress.tasks.total -
							prev.snapshot.progress.tasks.total,
					},
				};
			})
			.reverse();
	}, [data]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader />
			</div>
		);
	}

	if (!data?.data.length) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<HistoryIcon className="mb-2 size-8 text-muted-foreground" />
				<p className="text-muted-foreground text-sm">No updates yet</p>
				<p className="text-muted-foreground text-xs">
					Post your first health update above
				</p>
			</div>
		);
	}

	return (
		<div className="relative">
			{/* Timeline line */}
			<div className="absolute top-0 bottom-0 left-4 w-px bg-border" />

			<ul className="space-y-6">
				{withDiff.map((update, index) => (
					<HealthUpdateItem
						key={update.id}
						update={update}
						isFirst={index === 0}
					/>
				))}
			</ul>
		</div>
	);
};

const HealthUpdateItem = ({
	update,
	isFirst,
}: {
	update: HealthUpdateWithDiff;
	isFirst: boolean;
}) => {
	const queryClient = useQueryClient();
	const { setParams } = useProjectHealthUpdateParams();

	const { mutate: deleteHealthUpdate, isPending: isDeleting } = useMutation(
		trpc.projectHealthUpdates.delete.mutationOptions({
			onMutate: () => {
				toast.loading("Deleting health update...", {
					id: "delete-health-update",
				});
			},
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.projectHealthUpdates.getLatest.queryOptions({
						projectId: update.projectId,
					}),
				);
				queryClient.invalidateQueries(
					trpc.projectHealthUpdates.get.queryOptions({
						projectId: update.projectId,
					}),
				);
				toast.success("Health update deleted", {
					id: "delete-health-update",
				});
			},
			onError: (error) => {
				toast.error(error.message || "Failed to delete health update", {
					id: "delete-health-update",
				});
			},
		}),
	);

	const handleEdit = () => {
		setParams({ healthUpdateId: update.id });
	};

	const handleDelete = () => {
		deleteHealthUpdate({ id: update.id });
	};

	return (
		<li className="group relative pl-10">
			{/* Timeline dot */}
			<div className="absolute top-1 left-2 flex size-4 items-center justify-center rounded-full bg-card">
				<ProjectHealthIcon health={update.health} className="size-4" />
			</div>

			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<div className="flex flex-wrap items-center gap-2">
						<ProjectHealthLabel health={update.health} className="text-sm" />
						{isFirst && (
							<span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary text-xs">
								Latest
							</span>
						)}
					</div>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								type="button"
								size="sm"
								variant="ghost"
								className="size-6 opacity-0 transition-opacity group-hover:opacity-100"
								disabled={isDeleting}
							>
								<EllipsisVerticalIcon />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem onSelect={handleEdit}>
								<PencilIcon />
								Edit
							</DropdownMenuItem>
							<DropdownMenuItem variant="destructive" onSelect={handleDelete}>
								<TrashIcon />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{update.summary && (
					<Response className="prose prose-sm max-w-none text-muted-foreground text-sm [&_p]:m-0">
						{update.summary}
					</Response>
				)}

				{update.snapshot && (
					<div className="flex flex-wrap gap-4 text-muted-foreground text-xs">
						{update.diff.completed > 0 && (
							<span>
								<CheckIcon className="mr-1 inline-block size-3.5" />+
								{update.diff.completed} Tasks Completed
							</span>
						)}
						{update.diff.open > 0 && (
							<span>
								<GaugeCircleIcon className="mr-1 inline-block size-3.5" />
								{update.diff.open} Tasks In Progress
							</span>
						)}
					</div>
				)}

				<div className="flex items-center gap-2 text-muted-foreground text-xs">
					{update.createdBy && (
						<>
							<AssigneeAvatar
								name={update.createdBy.name}
								image={update.createdBy.image}
								className="size-4"
							/>
							<span>{update.createdBy.name}</span>
							<span>•</span>
						</>
					)}
					{update.createdAt && (
						<span>
							{formatRelative(new Date(update.createdAt), new Date())}
						</span>
					)}
				</div>
			</div>
		</li>
	);
};
