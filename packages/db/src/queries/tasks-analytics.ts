import { UTCDate } from "@date-fns/utc";
import { format } from "date-fns";
import { and, asc, desc, eq, gte, inArray, lte, not, sql } from "drizzle-orm";
import { db } from "../index";
import { activities, columns, tasks, users, usersOnTeams } from "../schema";

export const getTasksBurnup = async ({
	teamId,
	startDate,
	endDate,
}: {
	teamId: string;
	startDate: Date;
	endDate: Date;
}) => {
	const data = new Map<
		string,
		{
			taskCompletedCount: number;
			taskCreatedCount: number;
		}
	>();

	const seriesDates = sql`generate_series(${startDate.toISOString()}::timestamp, ${endDate.toISOString()}::timestamp, '1 day'::interval) AS created_at(date)`;

	const [tasksCompleted, tasksCreated] = await Promise.all([
		db
			.select({
				createdAt: sql<Date>`created_at.date`,
				completedCount: sql<number>`SUM(COUNT(${activities.id})) OVER (ORDER BY DATE(created_at.date) ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`,
			})
			.from(seriesDates)
			.leftJoin(
				activities,
				and(
					eq(sql`DATE(${activities.createdAt})`, sql`DATE(created_at.date)`),
					eq(activities.teamId, teamId),
					eq(activities.type, "task_completed"),
				),
			)
			.groupBy(sql`created_at.date`),
		db
			.select({
				createdAt: sql<Date>`created_at.date`,
				createdCount: sql<number>`SUM(COUNT(${activities.id})) OVER (ORDER BY DATE(created_at.date) ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`,
			})
			.from(seriesDates)
			.leftJoin(
				activities,
				and(
					eq(sql`DATE(${activities.createdAt})`, sql`DATE(created_at.date)`),
					eq(activities.teamId, teamId),
					eq(activities.type, "task_created"),
				),
			)
			.groupBy(sql`created_at.date`),
	]);

	for (const row of tasksCompleted) {
		const dateKey = format(
			new UTCDate(row.createdAt),
			"yyyy-MM-dd 00:00:00+00",
		);
		const current = data.get(dateKey);
		data.set(dateKey, {
			...current!,
			taskCompletedCount: Number(row.completedCount),
		});
	}

	for (const createdTask of tasksCreated) {
		const dateKey = format(
			new UTCDate(createdTask.createdAt),
			"yyyy-MM-dd 00:00:00+00",
		);
		const current = data.get(dateKey);
		data.set(dateKey, {
			...current!,
			taskCreatedCount: Number(createdTask.createdCount),
		});
	}

	return Array.from(data.entries()).map(([date, value]) => ({
		date,
		...value,
	}));
};

export const getTasksSummaryByMember = async ({
	teamId,
	startDate,
	endDate,
}: {
	teamId: string;
	startDate: Date;
	endDate: Date;
}) => {
	const completedSubquery = db
		.select({
			memberId: sql<string>`activities.user_id`.as("member_id"),
			completedCount: sql<number>`COUNT(*)`.as("completed_count"),
		})
		.from(activities)
		.where(
			and(
				eq(activities.teamId, teamId),
				inArray(activities.type, [
					"task_completed",
					"checklist_item_completed",
				]),
				gte(activities.createdAt, startDate.toISOString()),
				lte(activities.createdAt, endDate.toISOString()),
			),
		)
		.groupBy(activities.userId);

	const assignedSubquery = db
		.select({
			memberId: sql<string>`tasks.assignee_id`.as("member_id"),
			assignedCount: sql<number>`COUNT(*)`.as("assigned_count"),
		})
		.from(tasks)
		.where(
			and(
				eq(tasks.teamId, teamId),
				not(inArray(columns.type, ["done", "backlog"])),
			),
		)
		.innerJoin(columns, eq(tasks.columnId, columns.id))
		.groupBy(tasks.assigneeId);

	const data = await db
		.select({
			member: {
				id: users.id,
				name: users.name,
				color: users.color,
			},
			completedCount: sql<number>`COALESCE(completed.completed_count, 0)`,
			assignedCount: sql<number>`COALESCE(assigned.assigned_count, 0)`,
		})
		.from(usersOnTeams)
		.where(and(eq(usersOnTeams.teamId, teamId)))
		.leftJoin(
			completedSubquery.as("completed"),
			eq(usersOnTeams.userId, sql`completed.member_id`),
		)
		.leftJoin(
			assignedSubquery.as("assigned"),
			eq(usersOnTeams.userId, sql`assigned.member_id`),
		)
		.innerJoin(users, eq(usersOnTeams.userId, users.id))
		.orderBy(desc(sql`COALESCE(assigned.assigned_count, 0)`));

	return data;
};

export const getTasksTodo = async ({ teamId }: { teamId: string }) => {
	const data = await db
		.select({
			id: tasks.id,
			title: tasks.title,
			dueDate: tasks.dueDate,
			assigneeId: tasks.assigneeId,
			columnId: tasks.columnId,
			priority: tasks.priority,
			column: {
				id: columns.id,
				name: columns.name,
				type: columns.type,
			},
			assignee: {
				id: users.id,
				name: users.name,
				color: users.color,
			},
		})
		.from(tasks)
		.innerJoin(columns, eq(tasks.columnId, columns.id))
		.leftJoin(users, eq(tasks.assigneeId, users.id))
		.where(
			and(
				eq(tasks.teamId, teamId),
				not(inArray(columns.type, ["done", "backlog"])),
			),
		)
		.limit(4)
		.orderBy(
			asc(
				sql`CASE ${tasks.priority} WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END`,
			),
			desc(tasks.dueDate),
		);

	return data;
};

export const getTasksByColumn = async ({
	teamId,
	startDate,
	endDate,
}: {
	teamId: string;
	startDate: Date;
	endDate: Date;
}) => {
	const data = await db
		.select({
			column: {
				id: columns.id,
				name: columns.name,
				type: columns.type,
			},
			taskCount: sql<number>`COUNT(${tasks.id})`,
		})
		.from(tasks)
		.innerJoin(columns, eq(tasks.columnId, columns.id))
		.where(
			and(
				eq(tasks.teamId, teamId),
				not(inArray(columns.type, ["done", "backlog"])),
			),
		)
		.groupBy(columns.id)
		.orderBy(asc(columns.order));

	return data.map((item) => ({
		...item,
		taskCount: Number(item.taskCount),
	}));
};

export const getTasksCompletionRate = async ({
	teamId,
	startDate,
	endDate,
}: {
	teamId: string;
	startDate: Date;
	endDate: Date;
}) => {
	const seriesDates = sql`generate_series(${startDate.toISOString()}::timestamp, ${endDate.toISOString()}::timestamp, '1 day'::interval) AS created_at(date)`;

	// get tasks completion by date
	const data = await db
		.select({
			date: sql<Date>`DATE(created_at.date)`,
			completedCount: sql<number>`COUNT(${activities.id})`,
		})
		.from(seriesDates)
		.innerJoin(
			activities,
			and(
				eq(sql`DATE(${activities.createdAt})`, sql`DATE(created_at.date)`),
				eq(activities.teamId, teamId),
				eq(activities.type, "task_completed"),
			),
		)
		.groupBy(sql`DATE(created_at.date)`)
		.orderBy(asc(sql`DATE(created_at.date)`));

	return data.map((item) => ({
		date: format(new UTCDate(item.date), "yyyy-MM-dd"),
		completedCount: Number(item.completedCount),
	}));
};
