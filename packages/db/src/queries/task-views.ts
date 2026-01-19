import { and, asc, desc, eq, getTableColumns, type SQL } from "drizzle-orm";
import { db } from "..";
import { projects, taskViews } from "../schema";
import { jsonAggBuildObject } from "../utils/drizzle";

export const getTaskViews = async ({
	teamId,
	userId,
	projectId,
	pageSize = 20,
	cursor,
}: {
	teamId: string;
	userId?: string;
	projectId?: string;
	pageSize?: number;
	cursor?: string;
}) => {
	const whereClause: SQL[] = [eq(taskViews.teamId, teamId)];
	if (userId) whereClause.push(eq(taskViews.userId, userId));
	if (projectId) whereClause.push(eq(taskViews.projectId, projectId));

	const offset = cursor ? Number.parseInt(cursor, 10) : 0;

	const data = await db
		.select({
			...getTableColumns(taskViews),
			project: {
				id: projects.id,
				name: projects.name,
				description: projects.description,
				color: projects.color,
			},
		})
		.from(taskViews)
		.leftJoin(projects, eq(taskViews.projectId, projects.id))
		.where(and(...whereClause))
		.orderBy(
			asc(taskViews.projectId),
			desc(taskViews.isDefault),
			desc(taskViews.createdAt),
		)
		.limit(pageSize)
		.offset(offset);

	const nextCursor =
		data.length === pageSize ? (offset + pageSize).toString() : undefined;

	return {
		meta: {
			cursor: nextCursor ?? null,
			hasPreviousPage: offset > 0,
			hasNextPage: data.length === pageSize,
		},
		data,
	};
};

export const getDefaultTaskView = async ({
	teamId,
	projectId,
}: {
	teamId: string;
	projectId?: string;
}) => {
	const whereClause: SQL[] = [
		eq(taskViews.teamId, teamId),
		eq(taskViews.isDefault, true),
	];
	if (projectId) whereClause.push(eq(taskViews.projectId, projectId));

	const [view] = await db
		.select()
		.from(taskViews)
		.where(and(...whereClause))
		.limit(1);

	return view;
};

export const getTaskViewById = async ({
	id,
	teamId,
}: {
	id: string;
	teamId: string;
}) => {
	const [view] = await db
		.select()
		.from(taskViews)
		.where(and(eq(taskViews.id, id), eq(taskViews.teamId, teamId)))
		.limit(1);

	return view;
};

export const createTaskView = async (input: {
	name: string;
	description?: string | null;
	teamId: string;
	userId: string;
	projectId?: string | null;
	viewType: string;
	filters: Record<string, unknown>;
	isDefault?: boolean;
}) => {
	// If this view is being set as default, unset any existing default for this project
	if (input.isDefault) {
		await unsetDefaultTaskViews({
			teamId: input.teamId,
			projectId: input.projectId,
		});
	}

	const [view] = await db
		.insert(taskViews)
		.values({
			name: input.name,
			description: input.description,
			teamId: input.teamId,
			userId: input.userId,
			projectId: input.projectId,
			viewType: input.viewType,
			filters: input.filters,
			isDefault: input.isDefault ?? false,
		})
		.returning();

	if (!view) {
		throw new Error("Failed to create task view");
	}

	return view;
};

export const updateTaskView = async ({
	id,
	teamId,
	...input
}: {
	id: string;
	teamId: string;
	name?: string;
	description?: string | null;
	viewType?: string;
	filters?: Record<string, unknown>;
	isDefault?: boolean;
}) => {
	// If setting as default, first unset any existing defaults
	if (input.isDefault) {
		// Get the view to find its projectId
		const existingView = await getTaskViewById({ id, teamId });
		if (existingView) {
			await unsetDefaultTaskViews({
				teamId,
				projectId: existingView.projectId,
			});
		}
	}

	const [view] = await db
		.update(taskViews)
		.set({
			...input,
			updatedAt: new Date().toISOString(),
		})
		.where(and(eq(taskViews.id, id), eq(taskViews.teamId, teamId)))
		.returning();

	if (!view) {
		throw new Error("Failed to update task view");
	}

	return view;
};

export const setDefaultTaskView = async ({
	id,
	teamId,
}: {
	id: string;
	teamId: string;
}) => {
	// Get the view to find its projectId
	const existingView = await getTaskViewById({ id, teamId });
	if (!existingView) {
		throw new Error("Task view not found");
	}

	// Unset any existing defaults for this project
	await unsetDefaultTaskViews({
		teamId,
		projectId: existingView.projectId,
	});

	// Set the new default
	const [view] = await db
		.update(taskViews)
		.set({
			isDefault: true,
			updatedAt: new Date().toISOString(),
		})
		.where(and(eq(taskViews.id, id), eq(taskViews.teamId, teamId)))
		.returning();

	if (!view) {
		throw new Error("Failed to set default task view");
	}

	return view;
};

const unsetDefaultTaskViews = async ({
	teamId,
	projectId,
}: {
	teamId: string;
	projectId?: string | null;
}) => {
	const whereClause: SQL[] = [
		eq(taskViews.teamId, teamId),
		eq(taskViews.isDefault, true),
	];
	if (projectId) {
		whereClause.push(eq(taskViews.projectId, projectId));
	}

	await db
		.update(taskViews)
		.set({ isDefault: false, updatedAt: new Date().toISOString() })
		.where(and(...whereClause));
};

export const deleteTaskView = async ({
	id,
	teamId,
}: {
	id: string;
	teamId: string;
}) => {
	const [view] = await db
		.delete(taskViews)
		.where(and(eq(taskViews.id, id), eq(taskViews.teamId, teamId)))
		.returning();

	if (!view) {
		throw new Error("Failed to delete task view");
	}

	return view;
};
