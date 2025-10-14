import { generateTaskEmbedding } from "@mimir/embedding/embeddings/task";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../index";
import { taskEmbeddings, tasks } from "../schema";

export const upsertTaskEmbedding = async ({
	task,
	teamId,
}: {
	task: {
		id: string;
		title: string;
	};
	teamId: string;
}) => {
	const { embedding, model } = await generateTaskEmbedding(task);

	const [record] = await db
		.insert(taskEmbeddings)
		.values({
			taskId: task.id,
			embedding,
			teamId,
			model,
		})
		.onConflictDoUpdate({
			target: [taskEmbeddings.taskId, taskEmbeddings.teamId],
			set: {
				embedding,
				model,
			},
		})
		.returning();

	return record;
};

export const getDuplicateTaskEmbedding = async ({
	task,
	teamId,
}: {
	task: { title: string; description?: string | null };
	teamId: string;
}) => {
	const THRESHOLD = 0.9; // Adjust this value based on your requirements

	const { embedding } = await generateTaskEmbedding(task);

	const matches = await db
		.select({
			id: tasks.id,
			title: tasks.title,
			score: sql<number>`1 - (${taskEmbeddings.embedding} <-> ${JSON.stringify(embedding)})`,
		})
		.from(taskEmbeddings)
		.where(
			and(
				eq(taskEmbeddings.teamId, teamId),
				sql`${taskEmbeddings.embedding} <-> ${JSON.stringify(embedding)} < ${THRESHOLD}`,
			),
		)
		.innerJoin(tasks, eq(tasks.id, taskEmbeddings.taskId))
		.orderBy(
			desc(
				sql`1 - (${taskEmbeddings.embedding} <-> ${JSON.stringify(embedding)})`,
			),
		)
		.limit(5);

	return matches;
};

export const deleteTaskEmbedding = async (taskId: string) => {
	await db.delete(taskEmbeddings).where(eq(taskEmbeddings.taskId, taskId));
};
