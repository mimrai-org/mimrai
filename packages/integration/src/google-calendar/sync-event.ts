import { db } from "@mimir/db/client";
import { getLinkedUserByUserId } from "@mimir/db/queries/integrations";
import { tasks, teams, users } from "@mimir/db/schema";
import { getAppUrl } from "@mimir/utils/envs";
import { eq, inArray } from "drizzle-orm";
import { calendar } from "googleapis/build/src/apis/calendar";
import { oauth2Client } from ".";

export const syncGoogleCalendarTaskEvent = async ({
	taskId,
	teamId,
	oldSubscribers,
}: {
	taskId: string;
	teamId: string;
	oldSubscribers?: string[];
}) => {
	const taskWithAssignees = await db
		.select()
		.from(tasks)
		.innerJoin(teams, eq(tasks.teamId, teams.id))
		.where(eq(tasks.id, taskId));

	if (!taskWithAssignees) {
		throw new Error("Task not found");
	}

	const oldSubscriberSet = new Set(oldSubscribers || []);
	const newSubscriberSet = new Set(
		taskWithAssignees.flatMap((t) => t.tasks.subscribers || []),
	);
	const removedSubscribers = [...oldSubscriberSet].filter(
		(id) => !newSubscriberSet.has(id),
	);

	// Handle removed subscribers: delete their calendar events
	for (const userId of removedSubscribers) {
		const link = await getLinkedUserByUserId({
			userId,
			integrationType: "google-calendar",
			teamId,
		});

		if (!link || !link.accessToken || !link.config?.credentials) {
			console.warn(`No Google Calendar linked user for user ${userId}`);
			continue;
		}

		if (!link.config.syncEvents) {
			console.warn(`Google Calendar sync disabled for user ${userId}`);
			continue;
		}

		oauth2Client.setCredentials(link.config?.credentials);

		const calendarClient = calendar({
			version: "v3",
			auth: oauth2Client,
		});

		const id = `${taskId}`.replace(/-/g, "");
		try {
			await calendarClient.events.delete({
				calendarId: "primary",
				eventId: id!,
			});
			console.log(
				`Deleted Google Calendar event ${id} for removed subscriber ${userId} of task ${taskId}`,
			);
		} catch (error) {
			console.error(
				`Failed to delete Google Calendar event ${id} for removed subscriber ${userId} of task ${taskId}:`,
				error,
			);
		}
	}

	for (const task of taskWithAssignees) {
		for (const userId of task.tasks.subscribers || []) {
			const link = await getLinkedUserByUserId({
				userId: userId,
				integrationType: "google-calendar",
				teamId: task.tasks.teamId,
			});

			if (!link || !link.accessToken || !link.config?.credentials) {
				console.warn(`No Google Calendar linked user for user ${userId}`);
				continue;
			}

			oauth2Client.setCredentials(link.config?.credentials);

			const calendarClient = calendar({
				version: "v3",
				auth: oauth2Client,
			});

			const id = `${task.tasks.id}`.replace(/-/g, "");
			const title = `${task.teams.prefix}-${task.tasks.sequence} ${task.tasks.title}`;

			if (!task.tasks.dueDate) {
				// No due date, delete the event if it exists
				try {
					await calendarClient.events.delete({
						calendarId: "primary",
						eventId: id!,
					});
					console.log(
						`Deleted Google Calendar event ${id} for task ${task.tasks.id} as due date was removed`,
					);
				} catch (error) {
					console.error(
						`Failed to delete Google Calendar event ${id} for task ${task.tasks.id}:`,
						error,
					);
				}

				continue;
			}

			const payload = {
				calendarId: "primary",
				requestBody: {
					summary: title,
					id,
					start: {
						dateTime: new Date(task.tasks.dueDate).toISOString(),
						timeZone: task.teams.timezone || "UTC",
					},
					end: {
						dateTime: new Date(task.tasks.dueDate).toISOString(),
						timeZone: task.teams.timezone || "UTC",
					},
					source: {
						title: `Task in ${task.teams.name}`,
						url: `${getAppUrl()}/team/${task.teams.slug}/tasks/${task.tasks.id}`,
					},
				},
			};

			try {
				// Insert or update the calendar event
				await calendarClient.events.insert(payload);
			} catch (error) {
				const typeError = error as {
					response: {
						status: number;
					};
				};

				if (typeError.response?.status === 409) {
					// Event already exists, update it
					try {
						await calendarClient.events.update({
							...payload,
							eventId: id!,
						});
					} catch (updateError) {
						console.error(
							`Failed to update Google Calendar event for task ${task.tasks.id}:`,
							updateError,
						);
					}
					continue;
				}

				console.error(
					`Failed to insert Google Calendar event for task ${task.tasks.id}:`,
					error,
				);
				continue;
			}

			console.log(
				`Synced task ${task.tasks.id} to Google Calendar for user ${userId}`,
			);
		}
	}
};

export const deleteGoogleCalendarTaskEvent = async (taskId: string) => {
	const taskWithAssignees = await db
		.select()
		.from(tasks)
		.innerJoin(users, eq(tasks.assigneeId, users.id))
		.where(eq(tasks.id, taskId));

	if (!taskWithAssignees) {
		throw new Error("Task not found");
	}

	for (const task of taskWithAssignees) {
		const link = await getLinkedUserByUserId({
			userId: task.user.id,
			integrationType: "google-calendar",
			teamId: task.tasks.teamId,
		});

		if (!link || !link.accessToken || !link.config?.credentials) {
			console.warn(`No Google Calendar linked user for user ${task.user.id}`);
			continue;
		}

		oauth2Client.setCredentials(link.config?.credentials);

		const calendarClient = calendar({
			version: "v3",
			auth: oauth2Client,
		});

		const id = `${task.tasks.id}`.replace(/-/g, "");

		try {
			await calendarClient.events.delete({
				calendarId: "primary",
				eventId: id!,
			});
			console.log(
				`Deleted Google Calendar event ${id} for task ${task.tasks.id}`,
			);
		} catch (error) {
			console.error(
				`Failed to delete Google Calendar event ${id} for task ${task.tasks.id}:`,
				error,
			);
		}
	}
};
