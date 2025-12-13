"use client";
import type { RouterOutputs } from "@api/trpc/routers";
import { memo } from "react";
import { useTasksViewContext } from "../tasks-view";
import { propertiesComponents } from "./task-properties-components";

export type Task = RouterOutputs["tasks"]["get"]["data"][number];
export const propertiesList = Object.keys(propertiesComponents) as Array<
	keyof typeof propertiesComponents
>;

export const TaskProperty = memo(
	({
		property,
		task,
	}: {
		property: keyof typeof propertiesComponents;
		task: Task;
	}) => {
		const { filters } = useTasksViewContext();

		if (!filters.properties?.includes(property)) return null;

		const Component = propertiesComponents[property];
		return <>{Component(task)}</>;
	},
);

export const TaskProperties = ({ task }: { task: Task }) => {
	return propertiesList.map((property) => {
		return <TaskProperty key={property} property={property} task={task} />;
	});
};
