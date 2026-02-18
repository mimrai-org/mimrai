import type { RouterOutputs } from "@mimir/trpc";
import { trpc } from "@/utils/trpc";
import type {
	DocumentMentionEntity,
	TaskMentionEntity,
	ToolMentionEntity,
	UserMentionEntity,
} from "./types";

// Type aliases for API responses
type Member = RouterOutputs["teams"]["getMembers"][0];
type Task = RouterOutputs["tasks"]["get"]["data"][0];
type Document = RouterOutputs["documents"]["get"]["data"][0];

/**
 * Transform a team member to a UserMentionEntity
 */
function memberToUserEntity(member: Member): UserMentionEntity {
	return {
		id: member.id,
		type: "user",
		label: member.name,
		name: member.name,
		email: member.email,
		image: member.image,
		color: member.color,
		metadata: {
			name: member.name,
			email: member.email,
			image: member.image,
			color: member.color,
		},
	};
}

/**
 * Transform a task to a TaskMentionEntity
 * Note: status and completed are included for the dropdown display,
 * but only id, label, and sequence are persisted in the mention node
 */
function taskToTaskEntity(task: Task): TaskMentionEntity {
	const statusType = task.statusId;
	const isCompleted = Boolean(task.completedAt);

	return {
		id: task.id,
		type: "task",
		label: task.title,
		title: task.title,
		sequence: task.sequence,
		status: statusType,
		completed: isCompleted,
		metadata: {
			sequence: task.sequence,
		},
	};
}

/**
 * Transform a document to a DocumentMentionEntity
 */
function documentToDocumentEntity(document: Document): DocumentMentionEntity {
	return {
		id: document.id,
		type: "document",
		label: document.name,
		name: document.name,
		icon: document.icon,
		metadata: {
			icon: document.icon,
		},
	};
}

/**
 * Query options for fetching users.
 * Members are fetched once and filtered client-side by query.
 */
export function usersQueryOptions() {
	return trpc.teams.getMembers.queryOptions({
		includeSystemUsers: true,
		isMentionable: true,
	});
}

/**
 * Query options for fetching tasks matching a search query.
 */
export function tasksQueryOptions(query: string) {
	return trpc.tasks.get.queryOptions({
		search: query,
		pageSize: 5,
	});
}

/**
 * Query options for fetching available tools.
 * Tools are fetched once and filtered client-side by query.
 */
export function toolsQueryOptions() {
	return trpc.agents.getTools.queryOptions();
}

/**
 * Query options for fetching documents matching a search query.
 */
export function documentsQueryOptions(query: string) {
	return trpc.documents.get.queryOptions({
		search: query,
		tree: false,
		pageSize: 5,
	});
}

/**
 * Select and transform raw members into UserMentionEntity[],
 * filtered by query.
 */
export function selectUsers(
	members: Member[],
	query: string,
): UserMentionEntity[] {
	return members
		.filter((member) => member.name.toLowerCase().includes(query.toLowerCase()))
		.slice(0, 5)
		.map(memberToUserEntity);
}

/**
 * Select and transform raw task response into TaskMentionEntity[].
 */
export function selectTasks(
	data: RouterOutputs["tasks"]["get"],
): TaskMentionEntity[] {
	return data.data.map(taskToTaskEntity);
}

/**
 * Select and transform raw document response into DocumentMentionEntity[].
 */
export function selectDocuments(
	data: RouterOutputs["documents"]["get"],
): DocumentMentionEntity[] {
	return data.data.map(documentToDocumentEntity);
}

/**
 * Select and transform raw tools response into ToolMentionEntity[],
 * filtered by query.
 */
export function selectTools(
	tools: RouterOutputs["agents"]["getTools"],
	query: string,
): ToolMentionEntity[] {
	return tools
		.filter((tool) =>
			tool.name
				.replace(/(:|<|>|_)*/, "")
				.toLowerCase()
				.match(new RegExp(query.replace(/(:|<|>|_)*/, ""), "i")),
		)
		.slice(0, 10)
		.map((tool) => ({
			id: tool.name,
			type: "tool" as const,
			label: tool.name,
			name: tool.name,
			description: tool.description,
			metadata: {
				description: tool.description,
			},
		}));
}
