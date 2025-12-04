import { useQueryStates } from "nuqs";
import {
	createLoader,
	parseAsArrayOf,
	parseAsBoolean,
	parseAsString,
	parseAsStringLiteral,
} from "nuqs/server";
import { useMemo } from "react";
import type { TasksGroupBy } from "@/components/tasks-view/tasks-group";
import type { TasksViewType } from "@/components/tasks-view/tasks-view";

// async import properties list to avoid circular dependency
const { propertiesList } = await import(
	"../components/tasks-view/task-properties"
);

export const tasksFilterParams = {
	assigneeId: parseAsArrayOf(parseAsString),
	columnId: parseAsArrayOf(parseAsString),
	columnType: parseAsArrayOf(parseAsString),
	projectId: parseAsArrayOf(parseAsString),
	milestoneId: parseAsArrayOf(parseAsString),
	search: parseAsString,
	labels: parseAsArrayOf(parseAsString),
	groupBy: parseAsStringLiteral<TasksGroupBy>([
		"assignee",
		"column",
		"milestone",
		"project",
	]).withDefault("column"),
	viewType: parseAsStringLiteral<TasksViewType>(["board", "list"]),
	properties: parseAsArrayOf(parseAsStringLiteral(propertiesList)),
	recurring: parseAsBoolean,
};

export const useTasksFilterParams = () => {
	const [params, setParams] = useQueryStates(tasksFilterParams, {
		urlKeys: {
			assigneeId: "aId",
			columnId: "cId",
			columnType: "cType",
			projectId: "pId",
			milestoneId: "mId",
			search: "s",
			labels: "l",
			groupBy: "gBy",
			viewType: "vType",
			properties: "props",
			recurring: "rec",
		},
	});

	const cleanParams = useMemo(() => {
		const cleaned: typeof params = { ...params };
		for (const key in cleaned) {
			if (
				cleaned[key as keyof typeof cleaned] === null ||
				cleaned[key as keyof typeof cleaned] === undefined
			) {
				delete cleaned[key as keyof typeof cleaned];
			}
		}
		// Return cleaned params without null, undefined, or empty array values type safely
		return cleaned as Partial<{
			[K in keyof typeof cleaned]: Exclude<
				(typeof cleaned)[K],
				null | undefined | []
			>;
		}>;
	}, [params]);

	return {
		params: cleanParams,
		setParams,
	};
};

export const loadTasksFilterParams = createLoader(tasksFilterParams);
