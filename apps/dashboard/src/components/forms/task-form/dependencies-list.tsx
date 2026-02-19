"use client";
import type { RouterOutputs } from "@mimir/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/ui/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import {
	ChevronRightIcon,
	EllipsisVerticalIcon,
	PlusIcon,
	TrashIcon,
} from "lucide-react";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import { Dropdown } from "react-day-picker";
import { useFormContext } from "react-hook-form";
import { DependencyIcon } from "@/components/dependency-icon";
import { PropertyStatus } from "@/components/tasks-view/properties/task-properties-components";
import { useTaskDependencyParams } from "@/hooks/use-task-dependency-params";
import { queryClient, trpc } from "@/utils/trpc";
import type { TaskFormValues } from "./form-type";

type Dependency = RouterOutputs["taskDependencies"]["get"]["dependsOn"][number];

const dependencyMeta = [
	{ type: "relates_to", label: "Relates to", direction: "to" },
	{ type: "relates_to", label: "Relates to", direction: "from" },
	{ type: "blocks", label: "Blocking to", direction: "to" },
	{ type: "blocks", label: "Blocked by", direction: "from" },
];

export const TaskFormDependenciesList = () => {
	const form = useFormContext<TaskFormValues>();
	const { setParams: setTaskDependecyParams } = useTaskDependencyParams();

	const id = form.watch("id");

	const { data: dependencies } = useQuery(
		trpc.taskDependencies.get.queryOptions(
			{
				taskId: id!,
			},
			{
				placeholderData: (prev) => prev,
				enabled: Boolean(id),
			},
		),
	);

	const total = dependencies
		? dependencies.dependsOn.length + dependencies.dependedBy.length
		: 0;

	if (!id) return null;

	return (
		<Collapsible className="space-y-1">
			<CollapsibleTrigger className="collapsible-chevron mb-2 flex items-center gap-1">
				<h3 className="text-muted-foreground text-xs">
					Dependencies
					{total > 0 ? ` +${total}` : ""}
				</h3>
			</CollapsibleTrigger>

			<CollapsibleContent>
				{dependencies?.dependsOn?.map((dependency) => (
					<Item
						dependency={dependency}
						taskId={id}
						key={`${dependency.dependsOnTaskId}:${dependency.taskId}`}
					/>
				))}
				{dependencies?.dependedBy?.map((dependency) => (
					<Item
						dependency={dependency}
						taskId={id}
						key={`${dependency.dependsOnTaskId}:${dependency.taskId}`}
					/>
				))}

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-muted-foreground text-xs transition-colors hover:text-foreground"
						>
							<PlusIcon className="size-3.5" />
							<div className="pl-2">Add Dependency</div>
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-48">
						<DropdownMenuItem
							onSelect={() => {
								setTaskDependecyParams({
									dependencyType: "relates_to",
									taskDependentId: id,
									dependencyDirection: "to",
								});
							}}
						>
							<DependencyIcon
								type="relates_to"
								className="text-muted-foreground"
							/>
							Related to...
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() => {
								setTaskDependecyParams({
									dependencyType: "blocks",
									taskDependentId: id,
									dependencyDirection: "to",
								});
							}}
						>
							<DependencyIcon type="blocks" className="text-muted-foreground" />
							Blocking to...
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() => {
								setTaskDependecyParams({
									dependencyType: "blocks",
									taskDependentId: id,
									dependencyDirection: "from",
								});
							}}
						>
							<DependencyIcon type="blocks" className="text-muted-foreground" />
							Blocked by...
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</CollapsibleContent>
		</Collapsible>
	);
};

const Item = ({
	dependency,
	taskId,
}: {
	dependency: Dependency;
	taskId: string;
}) => {
	const { mutate: deleteDependency } = useMutation(
		trpc.taskDependencies.delete.mutationOptions({
			onSettled: () => {
				queryClient.invalidateQueries(
					trpc.taskDependencies.get.queryOptions({
						taskId,
					}),
				);

				queryClient.invalidateQueries(
					trpc.taskDependencies.availableTasks.queryOptions({
						taskId,
					}),
				);

				queryClient.invalidateQueries(trpc.tasks.get.infiniteQueryOptions({}));
			},
		}),
	);

	const type =
		dependency.type === "blocks" &&
		dependency.dependsOnTaskId === taskId &&
		dependency.status.type === "done"
			? "relates_to"
			: dependency.type;
	const direction = taskId === dependency.dependsOnTaskId ? "from" : "to";
	const meta = dependencyMeta.find(
		(m) => m.type === type && m.direction === direction,
	);

	return (
		<div className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent dark:hover:bg-accent/30">
			<motion.div initial="initial" whileHover={"hover"} className="flex gap-2">
				<DependencyIcon type={type} direction={direction} className="size-4" />
				<motion.span
					variants={{
						initial: { width: 0, opacity: 0 },
						hover: { width: "auto", opacity: 1 },
					}}
					transition={{ duration: 0.2 }}
					className="overflow-hidden whitespace-nowrap text-muted-foreground text-xs"
				>
					{meta?.label || ""}
				</motion.span>
			</motion.div>
			{dependency.task.title}

			<div className="ml-auto flex items-center gap-2">
				<PropertyStatus
					task={{ id: dependency.task.id, status: dependency.status }}
				/>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button type="button" variant={"ghost"} className="size-6! p-0">
							<EllipsisVerticalIcon className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem
							variant="destructive"
							onSelect={() => {
								deleteDependency({
									taskId: dependency.taskId,
									dependsOnTaskId: dependency.dependsOnTaskId,
								});
							}}
						>
							<TrashIcon />
							Remove
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
};
