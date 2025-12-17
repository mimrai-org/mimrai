import { createAdminClient } from "@jobs/utils/supabase";
import { getImportById, updateImportStatus } from "@mimir/db/queries/imports";
import { createLabel, getLabelByName } from "@mimir/db/queries/labels";
import { getBacklogStatus } from "@mimir/db/queries/statuses";
import { createTask, getTaskByTitle } from "@mimir/db/queries/tasks";
import { getMemberByEmail } from "@mimir/db/queries/teams";
import { randomColor } from "@mimir/utils/random";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { generateObject } from "ai";
import * as cptable from "xlsx/dist/cpexcel.full.mjs";
import * as XLSX from "xlsx/xlsx.mjs";
import z from "zod";

export const tasksImportJob = schemaTask({
	id: "tasks-import",
	maxDuration: 15 * 60,
	retry: {
		maxAttempts: 1,
	},
	schema: z.object({
		importId: z.string(),
	}),
	onStart: async ({ payload }) => {
		const { importId } = payload;
		await updateImportStatus({
			id: importId,
			status: "processing",
		});
	},
	onFailure: async ({ payload }) => {
		const { importId } = payload;
		await updateImportStatus({
			id: importId,
			status: "failed",
		});
	},
	onSuccess: async ({ payload }) => {
		const { importId } = payload;
		await updateImportStatus({
			id: importId,
			status: "completed",
		});
	},
	run: async (payload, ctx) => {
		XLSX.set_cptable(cptable);
		const { importId } = payload;
		const importJob = await getImportById({ id: importId });

		if (!importJob) {
			throw new Error(`Import job with ID ${importId} not found`);
		}
		logger.info(`Processing import job with ID ${importId}`);

		const supabase = await createAdminClient();
		const downloadFile = await supabase.storage
			.from("imports")
			.download(importJob.filePath);

		// to buffer
		const buffer = await downloadFile.data?.arrayBuffer();

		const workbook = XLSX.read(buffer, { type: "buffer", codepage: 65001 });
		const sheetName = workbook.SheetNames[0];

		if (!sheetName) {
			throw new Error("No sheets found in the Excel file");
		}

		const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]!, {
			header: 1,
		});

		const headers = rows[0] as string[];
		const dataRows = rows.slice(1);
		const firstRow = dataRows[0] as string[];

		const headersMapResponse = await generateObject({
			model: "openai/gpt-4o",
			prompt: `Generate a mapping of the following headers to the schema fields
			Headers: 
			${JSON.stringify(headers, null, 2)}

			First Row (Example Data):
			${JSON.stringify(firstRow, null, 2)}
			`,
			schema: z.object({
				title: z.string().describe("The header name for the task title"),
				description: z
					.string()
					.optional()
					.describe("The header name for the task description"),
				dueDate: z
					.string()
					.optional()
					.describe("The header name for the task due date"),
				dueDateFormat: z
					.string()
					.optional()
					.describe(
						"Extract the due date format from the example data. Use date-fns format. https://date-fns.org/v2.30.0/docs/format",
					),
				priority: z
					.string()
					.optional()
					.describe(
						"The header name for the task priority. Must be one of [low, medium, high, urgent]",
					),
				assignee: z
					.string()
					.optional()
					.describe("The header name for the assignee email, or name"),
				labels: z
					.string()
					.optional()
					.describe("The header name for the task labels"),
			}),
		});
		const headersMap = headersMapResponse.object;

		const titleIndex = headers.indexOf(headersMap.title);
		const descriptionIndex = headersMap.description
			? headers.indexOf(headersMap.description)
			: -1;
		const dueDateIndex = headersMap.dueDate
			? headers.indexOf(headersMap.dueDate)
			: -1;
		const priorityIndex = headersMap.priority
			? headers.indexOf(headersMap.priority)
			: -1;
		const assigneeIndex = headersMap.assignee
			? headers.indexOf(headersMap.assignee)
			: -1;
		const labelsIndex = headersMap.labels
			? headers.indexOf(headersMap.labels)
			: -1;

		const backlogColumn = await getBacklogStatus({
			teamId: importJob.teamId,
		});

		const cacheLabelIds = new Map<string, string>();
		const cacheMemberIds = new Map<string, string | undefined>();
		let createdTasksCount = 0;
		for (const rowIndex in dataRows) {
			try {
				const row = dataRows[rowIndex] as string[];

				const title = row[titleIndex];

				const taskExists = await getTaskByTitle({
					teamId: importJob.teamId,
					title: title!,
				});

				if (taskExists) {
					logger.info(`Task with title ${title} already exists, skipping`);
					continue;
				}

				const description = row[descriptionIndex];
				const dueDate = row[dueDateIndex];
				const priority = row[priorityIndex];
				const assignee = row[assigneeIndex];
				const labels = row[labelsIndex];
				let labelsArray: string[] | undefined;
				const labelsIdsArray: string[] = [];
				let assigneeId: string | undefined;

				if (labels?.includes(",")) {
					labelsArray = labels.split(",").map((label) => label.trim());
				}

				if (labelsArray && labelsArray.length > 0) {
					for (const labelName of labelsArray) {
						if (cacheLabelIds.has(labelName)) {
							labelsIdsArray.push(cacheLabelIds.get(labelName)!);
							continue;
						}

						const exists = await getLabelByName({
							name: labelName,
							teamId: importJob.teamId,
						});

						if (exists) {
							labelsIdsArray.push(exists.id);
							cacheLabelIds.set(labelName, exists.id);
							continue;
						}

						const newLabel = await createLabel({
							name: labelName,
							color: randomColor(),
							teamId: importJob.teamId,
						});

						labelsIdsArray.push(newLabel.id);
						cacheLabelIds.set(labelName, newLabel.id);
					}
				}

				// assign the existing member or invite a new one
				if (assignee) {
					// check if the assignee is an email
					if (z.string().email().safeParse(assignee).success) {
						if (cacheMemberIds.has(assignee)) {
							assigneeId = cacheMemberIds.get(assignee);
						} else {
							const existingMember = await getMemberByEmail({
								email: assignee,
								teamId: importJob.teamId,
							});

							if (existingMember) {
								// if the member exists in the team, assign them
								assigneeId = existingMember.id;
								cacheMemberIds.set(assignee, existingMember.id);
							} else {
								cacheMemberIds.set(assignee, undefined);
							}
						}
					}
				}

				await createTask({
					title: title!,
					description: description,
					statusId: backlogColumn.id,
					teamId: importJob.teamId,
					userId: importJob.userId,
					labels: labelsIdsArray.length > 0 ? labelsIdsArray : undefined,
					assigneeId,
				});

				createdTasksCount++;
			} catch (error) {
				logger.error(`Failed to create task for row ${rowIndex}: ${error}`);
			}
		}

		logger.info(
			`Import job ${importId} completed. Created ${createdTasksCount} tasks.`,
		);
	},
});
