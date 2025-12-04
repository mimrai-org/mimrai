"use client";
import { DataSelectInput } from "@mimir/ui/data-select-input";
import { Input } from "@mimir/ui/input";
import { Button } from "@ui/components/ui/button";
import { Checkbox } from "@ui/components/ui/checkbox";
import { Label } from "@ui/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@ui/components/ui/radio-group";
import { cn } from "@ui/lib/utils";
import {
	BoxIcon,
	EyeIcon,
	KanbanIcon,
	ListIcon,
	SearchIcon,
	TagsIcon,
	UserIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { trpc } from "@/utils/trpc";
import { LabelInput } from "../forms/task-form/label-input";
import { Assignee, AssigneeAvatar } from "../kanban/asignee-avatar";
import { MilestoneIcon } from "../milestone-icon";
import { ProjectIcon } from "../project-icon";
import { propertiesComponents } from "./task-properties";
import { type TasksGroupBy, tasksGroupByItems } from "./tasks-group";
import { useTasksViewContext } from "./tasks-view";

export type TasksFiltersProps = {
	showFilters?: Array<"assignee" | "project" | "milestone" | "labels">;
};

export const TasksFilters = ({
	showFilters = ["assignee", "project", "milestone", "labels"],
}: TasksFiltersProps) => {
	const { filters, setFilters } = useTasksViewContext();

	const [search, setSearch] = useState(filters.search || "");

	const debouncedSetFilters = useDebounceCallback(setFilters, 500);
	const firstRender = useRef(true);

	useEffect(() => {
		if (firstRender.current) return;
		setTimeout(() => {
			firstRender.current = false;
		}, 1000);
	}, []);

	useEffect(() => {
		debouncedSetFilters({
			search: search,
		});
	}, [search]);

	return (
		<div className="flex w-full items-center justify-between gap-4 border-b p-2">
			<div className="flex items-center gap-2 px-2">
				<div className="relative flex items-center">
					<SearchIcon className="absolute left-2 size-4 text-muted-foreground" />
					<Input
						variant={"ghost"}
						placeholder="Search tasks..."
						className="w-52 pl-8"
						value={search || ""}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>

				{showFilters?.includes("assignee") && (
					<div className="relative flex items-center">
						<UserIcon className="absolute left-2 size-4 text-muted-foreground" />

						<DataSelectInput
							queryOptions={trpc.teams.getMembers.queryOptions(
								{},
								{
									select: (data) => data,
								},
							)}
							value={filters.assigneeId}
							multiple
							onChange={(value) => setFilters({ assigneeId: value || null })}
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

				{showFilters?.includes("project") && (
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
							value={filters.projectId || null}
							onChange={(value) => setFilters({ projectId: value || null })}
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
				)}

				{showFilters?.includes("milestone") && (
					<div className="relative flex items-center">
						<MilestoneIcon className="absolute left-2 size-4 text-muted-foreground opacity-50" />

						<DataSelectInput
							queryOptions={trpc.milestones.get.queryOptions(
								{},
								{
									select: (data) => data.data,
								},
							)}
							multiple
							value={filters.milestoneId ?? null}
							onChange={(value) => setFilters({ milestoneId: value || null })}
							getLabel={(item) => item?.name ?? ""}
							getValue={(item) => item?.id ?? ""}
							placeholder="Filter by milestone"
							className="w-52 pl-8"
							showChevron={false}
							renderMultiple={(items) => (
								<div className="flex gap-2">
									{items.map((item) => (
										<span
											key={item.id}
											className="flex items-center gap-2 rounded-sm bg-secondary px-2 py-1 text-xs"
										>
											<MilestoneIcon className="size-3.5" {...item} />
											{item.name}
										</span>
									))}
								</div>
							)}
							renderItem={(item) => (
								<span className="flex items-center gap-2">
									<MilestoneIcon className="size-3.5" {...item} />
									{item.name}
								</span>
							)}
							variant={"ghost"}
						/>
					</div>
				)}

				{showFilters?.includes("labels") && (
					<div className="relative flex items-center">
						<TagsIcon className="absolute left-2 size-4 text-muted-foreground" />
						<LabelInput
							value={filters.labels || []}
							onChange={(labels) => setFilters({ labels })}
							placeholder="Add labels to filter"
							className="min-w-[120px] pl-8"
						/>
					</div>
				)}
			</div>

			<div className="flex gap-4">
				<Popover>
					<PopoverTrigger asChild>
						<Button variant={"outline"} size="sm">
							<EyeIcon />
							Display
						</Button>
					</PopoverTrigger>
					<PopoverContent>
						<div className="space-y-4">
							<div className="space-y-2">
								<div className="text-muted-foreground text-xs">
									Show Properties
								</div>
								<div className="flex flex-wrap gap-1 text-xs">
									{Object.entries(propertiesComponents).map(([key, _]) => (
										<button
											key={key}
											type="button"
											className={cn(
												"rounded-sm border px-2 py-1 capitalize hover:bg-accent/10",
												{
													"bg-accent hover:bg-accent/80":
														filters.properties?.includes(
															key as keyof typeof propertiesComponents,
														),
												},
											)}
											onClick={() => {
												const currentProperties = filters.properties || [];
												if (
													currentProperties.includes(
														key as keyof typeof propertiesComponents,
													)
												) {
													// Remove property
													const newProperties = currentProperties.filter(
														(prop) =>
															prop !==
															(key as keyof typeof propertiesComponents),
													);
													setFilters({
														...filters,
														properties: newProperties,
													});
												} else {
													// Add property
													setFilters({
														...filters,
														properties: [
															...currentProperties,
															key as keyof typeof propertiesComponents,
														],
													});
												}
											}}
										>
											{key}
										</button>
									))}
								</div>
							</div>
							<hr />
							<div className="space-y-2">
								<div className="text-muted-foreground text-xs">View As</div>
								<div className="grid h-16 grid-cols-2 gap-2">
									<button
										type="button"
										className={cn(
											"flex h-full items-center justify-center rounded-md border p-2 hover:bg-accent/80",
											{
												"bg-accent": filters.viewType === "list",
											},
										)}
										onClick={() => {
											setFilters({
												...filters,
												viewType: "list",
											});
										}}
									>
										<ListIcon className="size-4" />
									</button>
									<button
										type="button"
										className={cn(
											"flex h-full items-center justify-center rounded-md border p-2 hover:bg-accent/80",
											{
												"bg-accent": filters.viewType === "board",
											},
										)}
										onClick={() => {
											setFilters({
												...filters,
												viewType: "board",
											});
										}}
									>
										<KanbanIcon className="size-4" />
									</button>
								</div>
							</div>
							<hr />
							<div className="space-y-4">
								<div className="text-muted-foreground text-xs">Group By</div>
								<RadioGroup
									value={filters.groupBy || "column"}
									onValueChange={(value) =>
										setFilters({ ...filters, groupBy: value as TasksGroupBy })
									}
								>
									{tasksGroupByItems.map((item) => (
										<div key={item.value} className="flex items-center gap-2">
											<RadioGroupItem
												id={`group-by-${item.value}`}
												value={item.value}
											/>
											<Label
												htmlFor={`group-by-${item.value}`}
												className="text-xs"
											>
												{item.label}
											</Label>
										</div>
									))}
								</RadioGroup>
							</div>
							<hr />
							<div className="flex items-center gap-2">
								<Checkbox
									id="show-empty-columns"
									checked={filters?.showEmptyColumns || false}
									onCheckedChange={(checked) =>
										setFilters({
											...filters,
											showEmptyColumns: !!checked,
										})
									}
								/>
								<Label
									htmlFor="show-empty-columns"
									className="text-muted-foreground text-xs"
								>
									Show Empty Columns
								</Label>
							</div>
						</div>
					</PopoverContent>
				</Popover>
			</div>
		</div>
	);
};
