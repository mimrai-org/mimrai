"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from "@ui/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/ui/dialog";
import { useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { useTaskDependencyParams } from "@/hooks/use-task-dependency-params";
import { queryClient, trpc } from "@/utils/trpc";
import { DependencyIcon } from "../dependency-icon";
import { propertiesComponents } from "../tasks-view/properties/task-properties-components";

const labels = {
	blocks: {
		from: "is blocked by",
		to: "is blocking to",
	},
	relates_to: {
		from: "relates to",
		to: "is related to",
	},
};

export const TaskDependencyDialog = () => {
	const { taskDependentId, dependencyType, dependencyDirection, setParams } =
		useTaskDependencyParams();
	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebounceValue(search, 400);

	const isOpen = Boolean(taskDependentId && dependencyType);

	const { data } = useQuery(
		trpc.taskDependencies.availableTasks.queryOptions(
			{
				taskId: taskDependentId!,
				search: debouncedSearch,
			},
			{
				placeholderData: (prev) => prev,
				enabled: isOpen,
			},
		),
	);

	const { mutate: createDependency } = useMutation(
		trpc.taskDependencies.create.mutationOptions({
			onSuccess: () => {
				setParams(null);
			},
			onSettled: () => {
				queryClient.invalidateQueries(
					trpc.taskDependencies.get.queryOptions({
						taskId: taskDependentId!,
					}),
				);

				queryClient.invalidateQueries(
					trpc.taskDependencies.availableTasks.queryOptions({
						taskId: taskDependentId!,
					}),
				);

				queryClient.invalidateQueries(trpc.tasks.get.infiniteQueryOptions());
			},
		}),
	);

	return (
		<Dialog
			open={isOpen}
			onOpenChange={() => {
				setParams(null);
			}}
		>
			<DialogContent showCloseButton={false}>
				<DialogHeader className="hidden">
					<DialogTitle />
				</DialogHeader>
				<Command shouldFilter={false}>
					{dependencyType && dependencyDirection && (
						<div className="pb-2 text-muted-foreground text-sm">
							Select a task that {labels[dependencyType!][dependencyDirection!]}{" "}
							<DependencyIcon
								type={dependencyType!}
								direction={dependencyDirection!}
								className="mb-0.5 inline-block size-4"
							/>{" "}
							this task.
						</div>
					)}
					<CommandInput
						placeholder="Search tasks..."
						value={search}
						onValueChange={setSearch}
						containerClassName="h-11"
					/>
					<CommandList className="mt-2">
						<CommandEmpty>No tasks found.</CommandEmpty>
						{data?.map((result) => (
							<CommandItem
								key={result.id}
								className="animate-fade-in px-4 py-3"
								onSelect={() => {
									if (dependencyDirection === "from") {
										createDependency({
											taskId: result.id,
											type: dependencyType!,
											dependsOnTaskId: taskDependentId!,
										});
									} else {
										createDependency({
											taskId: taskDependentId!,
											type: dependencyType!,
											dependsOnTaskId: result.id,
										});
									}
								}}
							>
								<span className="text-muted-foreground">{result.sequence}</span>
								<div className="flex flex-1 overflow-hidden">
									<span className="truncate">{result.title}</span>
								</div>

								<div className="ml-auto flex items-center gap-2 text-muted-foreground text-sm">
									{propertiesComponents.status(result)}
								</div>
							</CommandItem>
						))}
					</CommandList>
				</Command>
			</DialogContent>
		</Dialog>
	);
};
