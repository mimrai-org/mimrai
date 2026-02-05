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
		"status",
		"milestone",
		"project",
	]),
	viewType: parseAsStringLiteral<TasksViewType>(["board", "list", "calendar"]),
	properties: parseAsArrayOf(parseAsString),
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
