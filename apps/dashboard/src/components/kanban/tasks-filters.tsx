"use client";
import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { taskFiltersArtifact } from "@mimir/api/ai/artifacts/task-filters";
import { DataSelectInput } from "@mimir/ui/data-select-input";
import { Input } from "@mimir/ui/input";
import { useEffect, useRef, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { useTasksFilterParams } from "@/hooks/use-tasks-filter-params";
import { trpc } from "@/utils/trpc";
import { LabelInput } from "../forms/task-form/label-input";
import { Assignee, AssigneeAvatar } from "./asignee";

export const TasksFilters = ({
	showAssigneeFilter = true,
}: {
	showAssigneeFilter?: boolean;
}) => {
	const { setParams, ...params } = useTasksFilterParams();
	const [filter, setFilter] = useState<Partial<typeof params>>(params);
	const debouncedSetParams = useDebounceCallback(setParams, 500);
	const firstRender = useRef(true);
	useArtifact(taskFiltersArtifact, {
		onUpdate: (data) => {
			const typedData = data as typeof params;
			if (firstRender.current) {
				firstRender.current = false;
				return;
			}
			setFilter({ ...typedData });
		},
	});

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
			<Input
				variant={"ghost"}
				placeholder="Search tasks..."
				className="min-w-56"
				value={filter.search || ""}
				onChange={(e) => setFilter({ ...filter, search: e.target.value })}
			/>

			{showAssigneeFilter && (
				<DataSelectInput
					queryOptions={trpc.teams.getMembers.queryOptions()}
					value={filter.assigneeId}
					multiple
					onChange={(value) => setFilter({ ...filter, assigneeId: value })}
					getValue={(item) => item.id}
					getLabel={(item) => item?.name || item?.email || "Unassigned"}
					variant={"ghost"}
					placeholder="Filter by assignee"
					showChevron={false}
					className="w-52"
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
				/>
			)}

			<LabelInput
				value={filter.labels || []}
				onChange={(labels) => setFilter({ ...filter, labels })}
				placeholder="Add labels to filter"
				className="min-w-[120px]"
			/>
		</div>
	);
};
