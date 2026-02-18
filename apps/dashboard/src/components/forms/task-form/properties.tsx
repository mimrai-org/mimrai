"use client";
import { Assignee } from "./assignee";
import { TaskFormDependenciesList } from "./dependencies-list";
import { DueDate } from "./due-date";
import { TaskExecution } from "./execution";
import { Labels } from "./labels";
import { MilestoneSelect } from "./milestone-select";
import { Priority } from "./priority";
import { ProjectSelect } from "./project-select";
import { Recurring } from "./recurring";
import { StatusSelect } from "./status-select";

export const TaskFormProperties = () => {
	return (
		<div className="space-y-2">
			<Labels />

			<div className="flex flex-wrap items-center gap-2">
				<Assignee />
				<DueDate />
				<Priority />
				<StatusSelect />
				<ProjectSelect />
				<MilestoneSelect />
				<Recurring />
			</div>

			<div className="mt-4">
				<TaskFormDependenciesList />
			</div>
		</div>
	);
};
