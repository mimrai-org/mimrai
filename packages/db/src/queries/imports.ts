import { and, desc, eq, inArray, type SQL } from "drizzle-orm";
import { db } from "../index";
import { imports, type taskImportStatusEnum } from "../schema";

export const createImport = async ({
	userId,
	teamId,
	fileUrl,
	filePath,
	fileName,
}: {
	userId: string;
	teamId: string;
	fileUrl?: string;
	filePath: string;
	fileName: string;
}) => {
	const [taskImport] = await db
		.insert(imports)
		.values({
			userId,
			teamId,
			fileUrl,
			filePath,
			fileName,
			status: "pending",
		})
		.returning();

	return taskImport;
};

export const updateImportStatus = async ({
	id,
	teamId,
	status,
	jobId,
}: {
	id: string;
	teamId?: string;
	status: (typeof taskImportStatusEnum.enumValues)[number];
	jobId?: string;
}) => {
	const whereClause: SQL[] = [eq(imports.id, id)];
	if (teamId) {
		whereClause.push(eq(imports.teamId, teamId));
	}

	const [taskImport] = await db
		.update(imports)
		.set({ status, jobId })
		.where(and(...whereClause))
		.returning();

	if (!taskImport) {
		throw new Error("Failed to update task import status");
	}

	return taskImport;
};

export const getImportById = async ({
	id,
	teamId,
}: {
	id: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(imports.id, id)];
	if (teamId) {
		whereClause.push(eq(imports.teamId, teamId));
	}

	const [taskImport] = await db
		.select()
		.from(imports)
		.where(and(...whereClause))
		.limit(1);

	return taskImport;
};

export const getImports = async ({
	status,
	cursor,
	pageSize = 10,
	teamId,
}: {
	status?: (typeof taskImportStatusEnum.enumValues)[number][];
	cursor?: string;
	pageSize?: number;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [];
	if (status && status.length > 0)
		whereClause.push(inArray(imports.status, status));

	if (teamId) whereClause.push(eq(imports.teamId, teamId));

	const query = db
		.select()
		.from(imports)
		.where(and(...whereClause))
		.orderBy(desc(imports.createdAt));

	// Apply pagination
	const offset = cursor ? Number.parseInt(cursor, 10) : 0;
	query.limit(pageSize).offset(offset);

	// Execute query
	const data = await query;

	// Calculate next cursor
	const nextCursor =
		data && data.length === pageSize
			? (offset + pageSize).toString()
			: undefined;

	return {
		meta: {
			cursor: nextCursor ?? null,
			hasPreviousPage: offset > 0,
			hasNextPage: data && data.length === pageSize,
		},
		data,
	};
};
