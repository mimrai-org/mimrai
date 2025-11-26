import { and, arrayContains, eq, type SQL, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "..";
import {
	shareable,
	type shareablePolicyEnum,
	type shareableTypeEnum,
} from "../schema";
import { getProjectById } from "./projects";
import { getTaskById, getTasks } from "./tasks";

export const generateShareableId = async (size = 12): Promise<string> => {
	const value = nanoid(size);
	const [existing] = await db
		.select({ exists: sql<boolean>`COUNT(*) > 0` })
		.from(shareable)
		.where(eq(shareable.id, value));
	if (existing?.exists) {
		return generateShareableId(size + 1);
	}
	return value;
};

export const upsertShareable = async ({
	resourceId,
	resourceType,
	teamId,
	policy,
	authorizedEmails,
}: {
	resourceId: string;
	resourceType: (typeof shareableTypeEnum.enumValues)[number];
	teamId: string;
	policy: (typeof shareablePolicyEnum.enumValues)[number];
	authorizedEmails?: string[];
}) => {
	const [newShare] = await db
		.insert(shareable)
		.values({
			id: await generateShareableId(),
			resourceId,
			resourceType,
			teamId,
			policy,
			authorizedEmails,
		})
		.onConflictDoUpdate({
			target: shareable.resourceId,
			set: {
				policy,
				authorizedEmails,
				updatedAt: new Date().toISOString(),
			},
		})
		.returning();

	return newShare;
};

export const deleteShareableByResource = async ({
	resourceId,
	resourceType,
	teamId,
}: {
	resourceId: string;
	resourceType: (typeof shareableTypeEnum.enumValues)[number];
	teamId: string;
}) => {
	const [record] = await db
		.delete(shareable)
		.where(
			and(
				eq(shareable.resourceId, resourceId),
				eq(shareable.resourceType, resourceType),
				eq(shareable.teamId, teamId),
			),
		)
		.returning();

	return record;
};

export const getShareableById = async ({
	id,
	userEmail,
}: {
	id: string;
	userEmail?: string;
}) => {
	const whereClause: SQL[] = [eq(shareable.id, id)];

	const [record] = await db
		.select()
		.from(shareable)
		.where(and(...whereClause));

	if (!record) {
		return null;
	}

	switch (record.policy) {
		case "private": {
			if (!userEmail) return null;
			if (
				!record.authorizedEmails ||
				!record.authorizedEmails.includes(userEmail)
			) {
				return null;
			}
			return record;
		}
		case "public":
			// No additional checks needed
			return record;
		default:
			return null;
	}
};

export const getShareableByResourceId = async ({
	resourceId,
	resourceType,
	teamId,
}: {
	resourceId: string;
	resourceType: (typeof shareableTypeEnum.enumValues)[number];
	teamId: string;
}) => {
	const whereClause: SQL[] = [
		eq(shareable.resourceId, resourceId),
		eq(shareable.resourceType, resourceType),
		eq(shareable.teamId, teamId),
	];

	const [record] = await db
		.select()
		.from(shareable)
		.where(and(...whereClause));

	if (!record) {
		return null;
	}

	return record;
};

export const getShareableResource = async ({
	id,
	userEmail,
}: {
	id: string;
	userEmail?: string;
}) => {
	const shareableRecord = await getShareableById({ id, userEmail });
	if (!shareableRecord) {
		return null;
	}

	switch (shareableRecord.resourceType) {
		case "task":
			return {
				type: "task" as const,
				policy: shareableRecord.policy,
				data: await getTaskById(shareableRecord.resourceId),
			};
		case "project":
			return {
				type: "project" as const,
				policy: shareableRecord.policy,
				data: {
					project: await getProjectById({
						projectId: shareableRecord.resourceId,
					}),
					tasks: await getTasks({
						pageSize: 20,
						projectId: [shareableRecord.resourceId],
						view: "board",
					}),
				},
			};
		default:
			return null;
	}
};
