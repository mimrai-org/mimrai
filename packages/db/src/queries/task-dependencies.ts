import { and, eq, notInArray, or, type SQL, sql } from "drizzle-orm";
import { db } from "..";
import { statuses, tasks, tasksDependencies } from "../schema";
import { buildSearchQuery } from "../utils/search-query";

export const createTaskDependency = async (input: {
	taskId: string;
	dependsOnTaskId: string;
	type?: "blocks" | "relates_to";
	explanation?: string;
	teamId: string;
}) => {
	// Verify both tasks exist and belong to the same team
	const [task, dependsOnTask] = await Promise.all([
		db
			.select({ id: tasks.id })
			.from(tasks)
			.where(and(eq(tasks.id, input.taskId), eq(tasks.teamId, input.teamId)))
			.limit(1),
		db
			.select({ id: tasks.id })
			.from(tasks)
			.where(
				and(
					eq(tasks.id, input.dependsOnTaskId),
					eq(tasks.teamId, input.teamId),
				),
			)
			.limit(1),
	]);

	if (!task[0]) {
		throw new Error("Task not found");
	}

	if (!dependsOnTask[0]) {
		throw new Error("Dependency task not found");
	}

	if (input.taskId === input.dependsOnTaskId) {
		throw new Error("A task cannot depend on itself");
	}

	const [dependency] = await db
		.insert(tasksDependencies)
		.values({
			taskId: input.taskId,
			dependsOnTaskId: input.dependsOnTaskId,
			type: input.type ?? "relates_to",
			explanation: input.explanation,
		})
		.onConflictDoNothing()
		.returning();

	if (!dependency) {
		throw new Error("Failed to create task dependency or it already exists");
	}

	return dependency;
};

export const updateTaskDependency = async ({
	taskId,
	dependsOnTaskId,
	teamId,
	...input
}: {
	taskId: string;
	dependsOnTaskId: string;
	type?: "blocks" | "relates_to";
	explanation?: string | null;
	teamId: string;
}) => {
	// Verify task belongs to the team
	const [task] = await db
		.select({ id: tasks.id })
		.from(tasks)
		.where(and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)))
		.limit(1);

	if (!task) {
		throw new Error("Task not found or access denied");
	}

	const [dependency] = await db
		.update(tasksDependencies)
		.set(input)
		.where(
			and(
				eq(tasksDependencies.taskId, taskId),
				eq(tasksDependencies.dependsOnTaskId, dependsOnTaskId),
			),
		)
		.returning();

	if (!dependency) {
		throw new Error("Failed to update task dependency");
	}

	return dependency;
};

export const getTaskDependencies = async ({
	taskId,
	teamId,
}: {
	taskId: string;
	teamId: string;
}) => {
	// Verify task belongs to the team
	const [task] = await db
		.select({ id: tasks.id })
		.from(tasks)
		.where(and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)))
		.limit(1);

	if (!task) {
		throw new Error("Task not found or access denied");
	}

	// Get dependencies where this task depends on others
	const dependsOn = await db
		.select({
			taskId: tasksDependencies.taskId,
			dependsOnTaskId: tasksDependencies.dependsOnTaskId,
			type: tasksDependencies.type,
			explanation: tasksDependencies.explanation,
			status: {
				id: statuses.id,
				name: statuses.name,
				description: statuses.description,
				order: statuses.order,
				type: statuses.type,
			},
			task: {
				id: tasks.id,
				title: tasks.title,
				permalinkId: tasks.permalinkId,
				statusId: tasks.statusId,
			},
		})
		.from(tasksDependencies)
		.innerJoin(tasks, eq(tasks.id, tasksDependencies.dependsOnTaskId))
		.innerJoin(statuses, eq(statuses.id, tasks.statusId))
		.where(eq(tasksDependencies.taskId, taskId));

	// Get tasks that depend on this task (blockers)
	const dependedBy = await db
		.select({
			taskId: tasksDependencies.taskId,
			dependsOnTaskId: tasksDependencies.dependsOnTaskId,
			type: tasksDependencies.type,
			explanation: tasksDependencies.explanation,
			status: {
				id: statuses.id,
				name: statuses.name,
				description: statuses.description,
				order: statuses.order,
				type: statuses.type,
			},
			task: {
				id: tasks.id,
				title: tasks.title,
				permalinkId: tasks.permalinkId,
				statusId: tasks.statusId,
			},
		})
		.from(tasksDependencies)
		.innerJoin(tasks, eq(tasks.id, tasksDependencies.taskId))
		.innerJoin(statuses, eq(statuses.id, tasks.statusId))
		.where(eq(tasksDependencies.dependsOnTaskId, taskId));

	return {
		dependsOn,
		dependedBy,
	};
};

export const deleteTaskDependency = async ({
	taskId,
	dependsOnTaskId,
	teamId,
}: {
	taskId: string;
	dependsOnTaskId: string;
	teamId: string;
}) => {
	// Verify task belongs to the team
	const [task] = await db
		.select({ id: tasks.id })
		.from(tasks)
		.where(and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)))
		.limit(1);

	if (!task) {
		throw new Error("Task not found or access denied");
	}

	const [dependency] = await db
		.delete(tasksDependencies)
		.where(
			and(
				eq(tasksDependencies.taskId, taskId),
				eq(tasksDependencies.dependsOnTaskId, dependsOnTaskId),
			),
		)
		.returning();

	if (!dependency) {
		throw new Error("Failed to delete task dependency");
	}

	return dependency;
};

export const getTaskDependencyById = async ({
	taskId,
	dependsOnTaskId,
	teamId,
}: {
	taskId: string;
	dependsOnTaskId: string;
	teamId: string;
}) => {
	// Verify task belongs to the team
	const [task] = await db
		.select({ id: tasks.id })
		.from(tasks)
		.where(and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)))
		.limit(1);

	if (!task) {
		throw new Error("Task not found or access denied");
	}

	const [dependency] = await db
		.select({
			taskId: tasksDependencies.taskId,
			dependsOnTaskId: tasksDependencies.dependsOnTaskId,
			type: tasksDependencies.type,
			explanation: tasksDependencies.explanation,
		})
		.from(tasksDependencies)
		.where(
			and(
				eq(tasksDependencies.taskId, taskId),
				eq(tasksDependencies.dependsOnTaskId, dependsOnTaskId),
			),
		)
		.limit(1);

	return dependency;
};

export const getAvailableDependencyTasks = async ({
	taskId,
	pageSize = 10,
	search,
	teamId,
}: {
	taskId: string;
	teamId: string;
	pageSize?: number;
	search?: string;
}) => {
	const existingRelations = await db
		.select({
			taskId: tasksDependencies.taskId,
			dependsOnTaskId: tasksDependencies.dependsOnTaskId,
		})
		.from(tasksDependencies)
		.where(
			or(
				eq(tasksDependencies.taskId, taskId),
				eq(tasksDependencies.dependsOnTaskId, taskId),
			),
		);
	const existingRelatedTaskIds = existingRelations.flatMap((relation) => [
		relation.taskId,
		relation.dependsOnTaskId,
	]);

	const whereClause: SQL[] = [
		eq(tasks.teamId, teamId),
		notInArray(tasks.id, [taskId]),
		// Exclude tasks that are already dependencies or dependents
		notInArray(tasks.id, existingRelatedTaskIds),
	];

	if (search) {
		// Check if the search input is a UUID
		const isUUID =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
				search,
			);

		if (isUUID) {
			whereClause.push(eq(tasks.id, search));
		} else if (!Number.isNaN(Number.parseInt(search, 10))) {
			whereClause.push(eq(tasks.sequence, Number.parseInt(search, 10)));
		} else {
			const query = buildSearchQuery(search);
			whereClause.push(
				sql`(to_tsquery('english', unaccent(${query})) @@ ${tasks.fts})`,
			);
		}
	}

	// Get tasks that can be added as dependencies (exclude self and existing dependencies)
	const query = db
		.select({
			id: tasks.id,
			title: tasks.title,
			permalinkId: tasks.permalinkId,
			statusId: tasks.statusId,
			sequence: tasks.sequence,
			status: {
				id: statuses.id,
				name: statuses.name,
				type: statuses.type,
				description: statuses.description,
				order: statuses.order,
			},
		})
		.from(tasks)
		.innerJoin(statuses, eq(statuses.id, tasks.statusId))
		.where(and(...whereClause))
		.limit(pageSize);

	const availableTasks = await query;

	return availableTasks;
};
