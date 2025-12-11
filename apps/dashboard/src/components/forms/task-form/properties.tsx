"use client";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Assignee } from "./assignee";
import { TaskFormDependenciesList } from "./dependencies-list";
import { DueDate } from "./due-date";
import { Labels } from "./labels";
import { MilestoneSelect } from "./milestone-select";
import { Priority } from "./priority";
import { ProjectSelect } from "./project-select";
import { Recurring } from "./recurring";
import { RepositorySelect } from "./repository-select";
import { StatusSelect } from "./status-select";

export const TaskFormProperties = () => {
	const { data: isGithubConnected } = useQuery(
		trpc.integrations.getByType.queryOptions(
			{
				type: "github",
			},
			{
				select: (data) => data.isInstalled,
				placeholderData: (data) => data,
			},
		),
	);

	return (
		<div>
			<Labels />

			<div className="flex flex-wrap items-center gap-2">
				<Assignee />
				<DueDate />
				<Priority />
				<StatusSelect />
				<ProjectSelect />
				<MilestoneSelect />
				<Recurring />
				{isGithubConnected && <RepositorySelect />}
			</div>

			<div className="mt-4">
				<TaskFormDependenciesList />
			</div>
		</div>
	);
};
