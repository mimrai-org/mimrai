import { and, count, eq, type SQL } from "drizzle-orm";
import { db } from "..";
import { labels, labelsOnTasks, tasks } from "../schema";

export const createLabel = async (input: {
	name: string;
	color: string;
	description?: string;
	teamId: string;
}) => {
	const [label] = await db
		.insert(labels)
		.values({
			...input,
		})
		.returning();

	if (!label) {
		throw new Error("Failed to create label");
	}

	return label;
};

export const updateLabel = async ({
	id,
	teamId,
	...input
}: {
	id: string;
	name?: string;
	color?: string;
	description?: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(labels.id, id)];
	teamId && whereClause.push(eq(labels.teamId, teamId));

	const [label] = await db
		.update(labels)
		.set({
			...input,
		})
		.where(and(...whereClause))
		.returning();

	if (!label) {
		throw new Error("Failed to update task label");
	}

	return label;
};

export const getLabelById = async ({
	id,
	teamId,
}: {
	id: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(labels.id, id)];
	teamId && whereClause.push(eq(labels.teamId, teamId));

	const [label] = await db
		.select()
		.from(labels)
		.where(and(...whereClause))
		.limit(1);

	return label;
};

export const getLabels = async ({
	teamId,
	pageSize = 20,
	cursor,
}: {
	teamId?: string;
	pageSize?: number;
	cursor?: string;
}) => {
	const whereClause: SQL[] = [];
	teamId && whereClause.push(eq(labels.teamId, teamId));

	const query = db
		.select({
			id: labels.id,
			name: labels.name,
			color: labels.color,
			description: labels.description,
			teamId: labels.teamId,
			createdAt: labels.createdAt,
			updatedAt: labels.updatedAt,
			taskCount: count(labelsOnTasks.taskId),
		})
		.from(labels)
		.where(and(...whereClause))
		.leftJoin(labelsOnTasks, eq(labels.id, labelsOnTasks.labelId))
		.groupBy(labels.id)
		.orderBy(labels.name);

	// Apply pagination
	const offset = cursor ? Number.parseInt(cursor, 10) : 0;
	query.limit(pageSize).offset(offset);

	const data = await query;

	return data;
};

export const deleteLabel = async ({
	id,
	teamId,
}: {
	id: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(labels.id, id)];
	teamId && whereClause.push(eq(labels.teamId, teamId));

	const [label] = await db
		.delete(labels)
		.where(and(...whereClause))
		.returning();

	if (!label) {
		throw new Error("Failed to delete label");
	}

	return label;
};

export const createDefaultLabels = async (teamId: string) => {
	const defaultLabels = [
		{
			name: "Feature",
			color: "#ebebeb",
			description: "New feature or request",
		},
		{ name: "Bug", color: "#523130", description: "Something isn't working" },
		{
			name: "Improvement",
			color: "#3a4737",
			description: "Enhancement to existing feature",
		},
	];

	const data = await db
		.insert(labels)
		.values(defaultLabels.map((label) => ({ ...label, teamId })))
		.returning();

	return data;
};

export const getLabelByName = async ({
	name,
	teamId,
}: {
	name: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(labels.name, name)];
	teamId && whereClause.push(eq(labels.teamId, teamId));

	const [label] = await db
		.select()
		.from(labels)
		.where(and(...whereClause))
		.limit(1);

	return label;
};
