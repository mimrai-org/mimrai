import { sql } from "drizzle-orm";
import { pgView, QueryBuilder, ViewBuilder } from "drizzle-orm/pg-core";
import { milestones, projects, tasks } from "../schema";

export const buildGlobalSearchView = () => {
	const qb = new QueryBuilder();

	const queries = [
		qb
			.select({
				id: tasks.id,
				type: sql<string>`'task'`.as("type"),
				title: tasks.title,
				color: sql<string>`NULL`.as("color"),
				parent_id: sql<string>`NULL`.as("parent_id"),
				team_id: tasks.teamId,
			})
			.from(tasks),
		qb
			.select({
				id: projects.id,
				type: sql<string>`'project'`.as("type"),
				title: projects.name,
				color: projects.color,
				parent_id: sql<string>`NULL`.as("parent_id"),
				team_id: projects.teamId,
			})
			.from(projects),
		qb
			.select({
				id: milestones.id,
				type: sql<string>`'milestone'`.as("type"),
				title: milestones.name,
				color: milestones.color,
				parent_id: milestones.projectId,
				team_id: milestones.teamId,
			})
			.from(milestones),
	];

	let union: any = queries[0]!;
	for (let i = 1; i < queries.length; i++) {
		union = union.unionAll(queries[i]!);
	}

	return pgView("global_search_view_v6").as(union);
};
