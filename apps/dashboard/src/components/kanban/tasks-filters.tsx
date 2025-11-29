"use client";
import { DataSelectInput } from "@mimir/ui/data-select-input";
import { Input } from "@mimir/ui/input";
import { BoxIcon, SearchIcon, TagsIcon, UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { useTasksFilterParams } from "@/hooks/use-tasks-filter-params";
import { trpc } from "@/utils/trpc";
import { LabelInput } from "../forms/task-form/label-input";
import { ProjectIcon } from "../project-icon";
import { Assignee, AssigneeAvatar } from "./asignee-avatar";

export const TasksFilters = ({
	showAssigneeFilter = true,
}: {
	showAssigneeFilter?: boolean;
}) => {
	const { setParams, ...params } = useTasksFilterParams();
	const [filter, setFilter] = useState<Partial<typeof params>>(params);
	const debouncedSetParams = useDebounceCallback(setParams, 500);
	const firstRender = useRef(true);

	useEffect(() => {
		setTimeout(() => {
			firstRender.current = false;
		}, 1000);
	}, []);

	useEffect(() => {
		debouncedSetParams(filter);
	}, [filter, debouncedSetParams]);

	return (
		<div className="flex items-center gap-2 px-2">
			<div className="relative flex items-center">
				<SearchIcon className="absolute left-2 size-4 text-muted-foreground" />
				<Input
					variant={"ghost"}
					placeholder="Search tasks..."
					className="w-52 pl-8"
					value={filter.search || ""}
					onChange={(e) => setFilter({ ...filter, search: e.target.value })}
				/>
			</div>

			{showAssigneeFilter && (
				<div className="relative flex items-center">
					<UserIcon className="absolute left-2 size-4 text-muted-foreground" />

					<DataSelectInput
						queryOptions={trpc.teams.getMembers.queryOptions(
							{},
							{
								select: (data) => data,
							},
						)}
						value={filter.assigneeId}
						multiple
						onChange={(value) => setFilter({ ...filter, assigneeId: value })}
						getValue={(item) => item.id}
						getLabel={(item) => item?.name || item?.email || "Unassigned"}
						placeholder="Filter by assignee"
						showChevron={false}
						className="w-52 pl-8"
						renderMultiple={(items) => (
							<div className="relative flex gap-1">
								{items.map((item, index) => (
									<div
										key={item.id}
										style={{
											transform: `translateX(-${index * 12}px)`,
										}}
									>
										<AssigneeAvatar {...item} className="size-6 shadow-sm" />
									</div>
								))}
							</div>
						)}
						renderItem={(item) => <Assignee {...item} />}
						variant={"ghost"}
					/>
				</div>
			)}

			<div className="relative flex items-center">
				<BoxIcon className="absolute left-2 size-4 text-muted-foreground" />

				<DataSelectInput
					queryOptions={trpc.projects.get.queryOptions(
						{},
						{
							select: (data) => data.data,
						},
					)}
					multiple
					value={filter.taskProjectId || null}
					onChange={(value) => setFilter({ ...filter, taskProjectId: value })}
					getLabel={(item) => item?.name ?? ""}
					getValue={(item) => item?.id ?? ""}
					placeholder="Filter by project"
					className="w-52 pl-8"
					showChevron={false}
					renderMultiple={(items) => (
						<div className="flex gap-2">
							{items.map((item) => (
								<span
									key={item.id}
									className="flex items-center gap-2 rounded-sm bg-secondary px-2 py-1 text-xs"
								>
									<ProjectIcon className="size-3.5" {...item} />
									{item.name}
								</span>
							))}
						</div>
					)}
					renderItem={(item) => (
						<span className="flex items-center gap-2">
							<ProjectIcon className="size-3.5" {...item} />
							{item.name}
						</span>
					)}
					variant={"ghost"}
				/>
			</div>

			<div className="relative flex items-center">
				<TagsIcon className="absolute left-2 size-4 text-muted-foreground" />
				<LabelInput
					value={filter.labels || []}
					onChange={(labels) => setFilter({ ...filter, labels })}
					placeholder="Add labels to filter"
					className="min-w-[120px] pl-8"
				/>
			</div>
		</div>
	);
};
