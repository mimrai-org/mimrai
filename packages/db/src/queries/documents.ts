import { and, asc, eq, isNull, max, type SQL, sql } from "drizzle-orm";
import { db } from "..";
import { documents, labels, labelsOnDocuments, users } from "../schema";
import { buildSearchQuery } from "../utils/search-query";

// ─── Types ───────────────────────────────────────────────────────────

type DocumentLabel = {
	id: string;
	name: string;
	color: string;
};

export type CreateDocumentInput = {
	name: string;
	icon?: string;
	content?: string;
	teamId: string;
	parentId?: string;
	createdBy: string;
	labels?: string[];
};

export type UpdateDocumentInput = {
	id: string;
	teamId: string;
	name?: string;
	icon?: string | null;
	content?: string;
	parentId?: string | null;
	updatedBy: string;
	labels?: string[];
};

// ─── Create ──────────────────────────────────────────────────────────

export const createDocument = async (input: CreateDocumentInput) => {
	const { labels: labelIds, ...values } = input;

	// Auto-assign order: place at end of siblings
	const [maxOrder] = await db
		.select({ maxOrder: max(documents.order) })
		.from(documents)
		.where(
			and(
				eq(documents.teamId, values.teamId),
				values.parentId
					? eq(documents.parentId, values.parentId)
					: isNull(documents.parentId),
			),
		);

	const nextOrder = (maxOrder?.maxOrder ?? -1) + 1;

	const [document] = await db
		.insert(documents)
		.values({ ...values, order: nextOrder })
		.returning();

	if (!document) {
		throw new Error("Failed to create document");
	}

	if (labelIds && labelIds.length > 0) {
		await db.insert(labelsOnDocuments).values(
			labelIds.map((labelId) => ({
				labelId,
				documentId: document.id,
			})),
		);
	}

	return document;
};

// ─── Update ──────────────────────────────────────────────────────────

export const updateDocument = async ({
	id,
	teamId,
	labels: labelIds,
	...input
}: UpdateDocumentInput) => {
	let cleanedContent: string | undefined;
	if (input.content) {
		// Replace plain \n with real newlines, and <br> tags with newlines as well, to allow for both formats
		cleanedContent = input.content.replace(/\\n|<br\s*\/?>/gi, "\n");
	}

	const [document] = await db
		.update(documents)
		.set({
			...input,
			content: cleanedContent,
			updatedAt: new Date().toISOString(),
		})
		.where(and(eq(documents.id, id), eq(documents.teamId, teamId)))
		.returning();

	if (!document) {
		throw new Error("Failed to update document");
	}

	if (labelIds !== undefined) {
		// Replace labels: delete existing then insert new
		await db
			.delete(labelsOnDocuments)
			.where(eq(labelsOnDocuments.documentId, id));

		if (labelIds.length > 0) {
			await db.insert(labelsOnDocuments).values(
				labelIds.map((labelId) => ({
					labelId,
					documentId: id,
				})),
			);
		}
	}

	return document;
};

// ─── Delete ──────────────────────────────────────────────────────────

export const deleteDocument = async ({
	id,
	teamId,
}: {
	id: string;
	teamId: string;
}) => {
	const [document] = await db
		.delete(documents)
		.where(and(eq(documents.id, id), eq(documents.teamId, teamId)))
		.returning();

	if (!document) {
		throw new Error("Failed to delete document");
	}

	return document;
};

// ─── Get by ID ───────────────────────────────────────────────────────

export const getDocumentById = async ({
	id,
	teamId,
}: {
	id: string;
	teamId: string;
}) => {
	const labelsSubquery = db
		.select({
			documentId: labelsOnDocuments.documentId,
			labels: sql<
				DocumentLabel[]
			>`COALESCE(json_agg(jsonb_build_object('id', ${labels.id}, 'name', ${labels.name}, 'color', ${labels.color})) FILTER (WHERE ${labels.id} IS NOT NULL), '[]'::json)`.as(
				"labels",
			),
		})
		.from(labelsOnDocuments)
		.leftJoin(labels, eq(labels.id, labelsOnDocuments.labelId))
		.groupBy(labelsOnDocuments.documentId)
		.as("labels_subquery");

	const [document] = await db
		.select({
			id: documents.id,
			name: documents.name,
			content: documents.content,
			icon: documents.icon,
			parentId: documents.parentId,
			createdBy: documents.createdBy,
			updatedBy: documents.updatedBy,
			createdAt: documents.createdAt,
			updatedAt: documents.updatedAt,
			labels: labelsSubquery.labels,
			creatorName: users.name,
		})
		.from(documents)
		.leftJoin(labelsSubquery, eq(documents.id, labelsSubquery.documentId))
		.leftJoin(users, eq(documents.createdBy, users.id))
		.where(and(eq(documents.id, id), eq(documents.teamId, teamId)))
		.limit(1);

	return document ?? null;
};

// ─── List / Search ───────────────────────────────────────────────────

export type DocumentTreeNode = {
	id: string;
	name: string;
	icon: string | null;
	content?: string | null;
	teamId?: string;
	parentId: string | null;
	order: number;
	createdBy: string;
	updatedBy: string | null;
	createdAt: string;
	updatedAt: string;
	labels: DocumentLabel[] | null;
	creatorName: string | null;
	children: DocumentTreeNode[];
};

export const getDocuments = async ({
	teamId,
	parentId,
	search,
	labels: labelIds,
	pageSize = 50,
	tree = true,
	cursor,
}: {
	teamId: string;
	parentId?: string | null;
	search?: string;
	labels?: string[];
	pageSize?: number;
	cursor?: string;
	tree?: boolean;
}) => {
	const whereClause: (SQL | undefined)[] = [eq(documents.teamId, teamId)];

	if (labelIds && labelIds.length > 0) {
		whereClause.push(
			sql`${documents.id} IN (
				SELECT ${labelsOnDocuments.documentId}
				FROM ${labelsOnDocuments}
				WHERE ${labelsOnDocuments.labelId} IN (${sql.join(
					labelIds.map((id) => sql`${id}`),
					sql`, `,
				)})
			)`,
		);
	}

	if (search) {
		const query = buildSearchQuery(search);
		whereClause.push(
			sql`(to_tsquery('english', unaccent(${query})) @@ ${documents.fts})`,
		);
	}

	const labelsSubquery = db
		.select({
			documentId: labelsOnDocuments.documentId,
			labels: sql<
				DocumentLabel[]
			>`COALESCE(json_agg(jsonb_build_object('id', ${labels.id}, 'name', ${labels.name}, 'color', ${labels.color})) FILTER (WHERE ${labels.id} IS NOT NULL), '[]'::json)`.as(
				"labels",
			),
		})
		.from(labelsOnDocuments)
		.leftJoin(labels, eq(labels.id, labelsOnDocuments.labelId))
		.groupBy(labelsOnDocuments.documentId)
		.as("labels_subquery");

	// Fetch all documents for this team (flat list) then build tree in-memory
	const query = db
		.select({
			id: documents.id,
			name: documents.name,
			icon: documents.icon,
			parentId: documents.parentId,
			order: documents.order,
			createdBy: documents.createdBy,
			updatedBy: documents.updatedBy,
			createdAt: documents.createdAt,
			updatedAt: documents.updatedAt,
			labels: labelsSubquery.labels,
			creatorName: users.name,
		})
		.from(documents)
		.leftJoin(labelsSubquery, eq(documents.id, labelsSubquery.documentId))
		.leftJoin(users, eq(documents.createdBy, users.id))
		.where(and(...whereClause))
		.orderBy(asc(documents.order), asc(documents.name));

	const offset = cursor ? Number.parseInt(cursor, 10) : 0;
	query.limit(pageSize).offset(offset);

	const allDocs = await query;

	const nextCursor =
		allDocs && allDocs.length === pageSize
			? (offset + pageSize).toString()
			: undefined;

	if (search || (labelIds && labelIds.length > 0) || !tree) {
		// If searching or filtering by labels, return flat list without tree structure
		return {
			data: allDocs.map((doc) => ({ ...doc, children: [] })),
			nextCursor,
		};
	}

	// Build tree from flat list
	const nodeMap = new Map<string, DocumentTreeNode>();
	for (const doc of allDocs) {
		nodeMap.set(doc.id, { ...doc, children: [] });
	}

	const roots: DocumentTreeNode[] = [];
	for (const node of nodeMap.values()) {
		if (node.parentId && nodeMap.has(node.parentId)) {
			nodeMap.get(node.parentId)!.children.push(node);
		} else if (!node.parentId) {
			roots.push(node);
		}
	}

	// If a specific parentId was requested, return that subtree's children
	if (parentId !== undefined && parentId !== null) {
		const parent = nodeMap.get(parentId);
		return { data: parent?.children ?? [] };
	}

	// If parentId === null, return roots only (with nested children)
	if (parentId === null) {
		// Apply pagination to roots
		return {
			data: roots,
			nextCursor,
		};
	}

	// No parentId filter — return all roots with nested children
	return {
		data: roots,
		nextCursor,
	};
};

// ─── Get document tree (breadcrumbs / path) ──────────────────────────

export const getDocumentPath = async ({
	id,
	teamId,
}: {
	id: string;
	teamId: string;
}) => {
	const result = await db.execute<{
		id: string;
		name: string;
		parent_id: string | null;
		depth: number;
	}>(sql`
		WITH RECURSIVE doc_path AS (
			SELECT id, name, parent_id, 0 as depth
			FROM documents
			WHERE id = ${id} AND team_id = ${teamId}
			UNION ALL
			SELECT d.id, d.name, d.parent_id, dp.depth + 1
			FROM documents d
			INNER JOIN doc_path dp ON d.id = dp.parent_id
		)
		SELECT id, name, parent_id, depth
		FROM doc_path
		ORDER BY depth DESC
	`);

	return result.rows.map((row) => ({
		id: row.id,
		name: row.name,
		parentId: row.parent_id,
	}));
};

// ─── Reorder documents ──────────────────────────────────────────────

export const reorderDocuments = async ({
	items,
	teamId,
}: {
	items: Array<{ id: string; order: number; parentId?: string | null }>;
	teamId: string;
}) => {
	const results = await Promise.all(
		items.map((item) => {
			const set: { order: number; parentId?: string | null } = {
				order: item.order,
			};
			if (item.parentId !== undefined) {
				set.parentId = item.parentId;
			}
			return db
				.update(documents)
				.set(set)
				.where(and(eq(documents.id, item.id), eq(documents.teamId, teamId)))
				.returning();
		}),
	);

	return results.flat();
};
