import type { RouterOutputs } from "@mimir/trpc";
import { queryClient, trpc } from "@/utils/trpc";

type TaskListResult = RouterOutputs["tasks"]["get"];
type TaskListItem = TaskListResult["data"][number];
type DocumentListResult = RouterOutputs["documents"]["get"];
type DocumentListItem = DocumentListResult["data"][number];

export function getCachedTaskFromList(
	taskId: string,
): TaskListItem | undefined {
	const cachedTaskQueries = queryClient.getQueriesData<TaskListResult>({
		queryKey: trpc.tasks.get.queryKey(),
	});

	for (const [, data] of cachedTaskQueries) {
		const task = data?.data.find((item) => item.id === taskId);
		if (task) return task;
	}

	return undefined;
}

export function getCachedDocumentFromList(
	documentId: string,
): DocumentListItem | undefined {
	const cachedDocumentQueries = queryClient.getQueriesData<DocumentListResult>({
		queryKey: trpc.documents.get.queryKey(),
	});

	for (const [, data] of cachedDocumentQueries) {
		const document = data?.data.find((item) => item.id === documentId);
		if (document) return document;
	}

	return undefined;
}
