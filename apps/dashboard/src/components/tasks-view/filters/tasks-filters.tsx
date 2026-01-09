"use client";
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
import { CalendarIcon, EyeIcon, KanbanIcon, ListIcon } from "lucide-react";
import { Filters, FiltersSearchInput } from "@/components/filters/filters";
import { FiltersProvider } from "@/components/filters/use-filters";
import { propertiesComponents } from "../properties/task-properties-components";
import { type TasksGroupBy, tasksGroupByItems } from "../tasks-group";
import { useTasksViewContext } from "../tasks-view";
import { tasksFilterOptions } from "./tasks-filters-options";

export type TasksFiltersProps = {
	showFilters?: Array<"assignee" | "project" | "milestone" | "labels">;
};

export const TasksFilters = ({
	showFilters = ["assignee", "project", "milestone", "labels"],
}: TasksFiltersProps) => {
	const { setFilters, filters } = useTasksViewContext();

	return (
		<FiltersProvider
			filters={filters}
			setFilters={setFilters}
			options={tasksFilterOptions}
		>
			<Filters>
				<FiltersSearchInput placeholder="Search tasks..." />
				<div className="ml-auto flex gap-4">
					<Popover>
						<PopoverTrigger asChild>
							<Button variant={"ghost"} size="sm">
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
									<div className="grid h-16 grid-cols-3 gap-2">
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
										<button
											type="button"
											className={cn(
												"flex h-full items-center justify-center rounded-md border p-2 hover:bg-accent/80",
												{
													"bg-accent": filters.viewType === "calendar",
												},
											)}
											onClick={() => {
												setFilters({
													...filters,
													viewType: "calendar",
												});
											}}
										>
											<CalendarIcon className="size-4" />
										</button>
									</div>
								</div>
								<hr />
								<div className="space-y-4">
									<div className="text-muted-foreground text-xs">Group By</div>
									<RadioGroup
										value={filters.groupBy || "status"}
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
										checked={filters?.showEmptyColumns}
										onCheckedChange={(checked) =>
											setFilters({
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
			</Filters>
		</FiltersProvider>
	);
};
