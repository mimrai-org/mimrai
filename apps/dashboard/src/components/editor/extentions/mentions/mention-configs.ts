import type { RouterOutputs } from "@mimir/trpc";
import { queryClient, trpc } from "@/utils/trpc";
import { TaskMentionListItem } from "./task-mention";
import type {
	AnyMentionEntity,
	MentionEntityConfig,
	TaskMentionEntity,
	UserMentionEntity,
} from "./types";
import { UserMentionListItem } from "./user-mention";

// Type aliases for API responses
type Member = RouterOutputs["teams"]["getMembers"][0];
type Task = RouterOutputs["tasks"]["get"]["data"][0];

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
	const statusType = task.status?.type;
	const isCompleted = statusType === "done";

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
			// status and completed are not persisted in the node
			// they're only used for dropdown display
		},
	};
}

/**
 * Fetch users matching the query
 */
async function fetchUsers(query: string): Promise<UserMentionEntity[]> {
	const members = await queryClient.fetchQuery(
		trpc.teams.getMembers.queryOptions({
			includeSystemUsers: true,
			isMentionable: true,
		}),
	);

	return members
		.filter((member) => member.name.toLowerCase().includes(query.toLowerCase()))
		.slice(0, 5)
		.map(memberToUserEntity);
}

/**
 * Fetch tasks matching the query
 */
async function fetchTasks(query: string): Promise<TaskMentionEntity[]> {
	const tasks = await queryClient.fetchQuery(
		trpc.tasks.get.queryOptions({
			search: query,
			pageSize: 5,
		}),
	);

	return tasks.data.map(taskToTaskEntity);
}

/**
 * Unified fetcher that returns all entity types
 * Fetches users and tasks in parallel
 */
export async function fetchAllMentions(
	query: string,
): Promise<AnyMentionEntity[]> {
	const [users, tasks] = await Promise.all([
		fetchUsers(query),
		fetchTasks(query),
	]);

	// Return combined results - users first, then tasks
	return [...users, ...tasks];
}

/**
 * User mention configuration
 * Used for type-specific operations
 */
export const userMentionConfig: MentionEntityConfig<UserMentionEntity> = {
	char: "@",
	type: "user",
	fetcher: fetchUsers,
	listItemRenderer: UserMentionListItem,
	nodeRenderer: () => null,
	emptyPlaceholder: "No members found",
};

/**
 * Task mention configuration
 * Used for type-specific operations
 */
export const taskMentionConfig: MentionEntityConfig<TaskMentionEntity> = {
	char: "@",
	type: "task",
	fetcher: fetchTasks,
	listItemRenderer: TaskMentionListItem,
	nodeRenderer: () => null,
	emptyPlaceholder: "No tasks found",
};

/**
 * Registry of all mention configurations
 * Add new entity configs here to extend the mention system
 */
export const mentionConfigs: MentionEntityConfig[] = [
	userMentionConfig as MentionEntityConfig,
	taskMentionConfig as MentionEntityConfig,
];

/**
 * Get mention configuration by type
 */
export function getMentionConfigByType(
	type: string,
): MentionEntityConfig | undefined {
	return mentionConfigs.find((config) => config.type === type);
}
