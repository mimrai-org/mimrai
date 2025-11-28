import { and, asc, eq, inArray, type SQL } from "drizzle-orm";
import { db } from "..";
import {
	type TaskSuggestionPayload,
	taskSuggestions,
	type taskSuggestionsStatusEnum,
} from "../schema";
import { createTaskComment, updateTask } from "./tasks";

export const getTasksSuggestions = async ({
	teamId,
	status,
	pageSize = 20,
}: {
	teamId: string;
	status?: (typeof taskSuggestionsStatusEnum.enumValues)[number][];
	pageSize?: number;
}) => {
	const whereClause: SQL[] = [eq(taskSuggestions.teamId, teamId)];

	if (status && status.length > 0) {
		whereClause.push(inArray(taskSuggestions.status, status));
	}

	const results = await db
		.select()
		.from(taskSuggestions)
		.where(and(...whereClause))
		.limit(pageSize)
		.orderBy(asc(taskSuggestions.createdAt));

	return results;
};

export const generateTaskSuggestionKey = ({
	teamId,
	taskId,
	type,
}: {
	teamId: string;
	taskId: string;
	type: string;
}) => {
	return `task-suggestion-${type}-${teamId}-${taskId}`;
};

export const createTaskSuggestion = async ({
	teamId,
	taskId,
	content,
	payload,
	status = "pending",
}: {
	teamId: string;
	content: string;
	taskId: string;
	payload: TaskSuggestionPayload;
	status?: (typeof taskSuggestionsStatusEnum.enumValues)[number];
}) => {
	const key = generateTaskSuggestionKey({ teamId, taskId, type: payload.type });

	// Check for existing suggestion with the same key
	const [existingSuggestion] = await db
		.select()
		.from(taskSuggestions)
		.where(
			and(
				eq(taskSuggestions.key, key),
				eq(taskSuggestions.teamId, teamId),
				eq(taskSuggestions.status, "pending"),
			),
		)
		.limit(1);

	if (existingSuggestion) {
		return existingSuggestion;
	}

	const [newSuggestion] = await db
		.insert(taskSuggestions)
		.values({
			teamId,
			taskId,
			content,
			payload,
			key,
			status,
		})
		.returning();

	return newSuggestion;
};

export const rejectTaskSuggestion = async ({
	id,
	teamId,
}: {
	id: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(taskSuggestions.id, id)];

	if (teamId) {
		whereClause.push(eq(taskSuggestions.teamId, teamId));
	}

	const [updatedSuggestion] = await db
		.update(taskSuggestions)
		.set({
			status: "rejected",
		})
		.where(and(...whereClause))
		.returning();

	return updatedSuggestion;
};

export const acceptTaskSuggestion = async ({
	id,
	teamId,
}: {
	id: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(taskSuggestions.id, id)];

	if (teamId) {
		whereClause.push(eq(taskSuggestions.teamId, teamId));
	}

	const [existingSuggestion] = await db
		.select()
		.from(taskSuggestions)
		.where(and(...whereClause))
		.limit(1);

	if (!existingSuggestion) {
		throw new Error("Task suggestion not found");
	}

	if (existingSuggestion.status === "accepted") {
		return existingSuggestion;
	}

	const [updatedSuggestion] = await db
		.update(taskSuggestions)
		.set({
			status: "accepted",
		})
		.where(and(...whereClause))
		.returning();

	await executeTaskSuggestion({
		id: existingSuggestion.id,
		teamId: existingSuggestion.teamId,
	});

	return updatedSuggestion;
};

export const executeTaskSuggestion = async ({
	id,
	teamId,
}: {
	id: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(taskSuggestions.id, id)];

	if (teamId) {
		whereClause.push(eq(taskSuggestions.teamId, teamId));
	}

	const [suggestion] = await db
		.select()
		.from(taskSuggestions)
		.where(and(...whereClause))
		.limit(1);

	if (!suggestion) {
		throw new Error("Task suggestion not found");
	}

	switch (suggestion.payload.type) {
		case "assign": {
			return await updateTask({
				id: suggestion.taskId,
				teamId: suggestion.teamId,
				assigneeId: suggestion.payload.assigneeId,
			});
		}
		case "move": {
			return await updateTask({
				id: suggestion.taskId,
				teamId: suggestion.teamId,
				columnId: suggestion.payload.columnId,
			});
		}
		case "comment": {
			return await createTaskComment({
				taskId: suggestion.taskId,
				teamId: suggestion.teamId,
				comment: suggestion.payload.comment,
			});
		}
	}
};
