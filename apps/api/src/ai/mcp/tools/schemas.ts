import { z } from "zod";

export const CHARACTER_LIMIT = 25000;

/**
 * Truncate text to character limit
 */
export function truncateText(text: string, limit = CHARACTER_LIMIT): string {
	if (text.length <= limit) return text;
	return `${text.slice(0, limit)}\n\n... (truncated, ${text.length - limit} characters omitted)`;
}

/**
 * Check if context has required scope
 */
export function hasScope(ctx: { scopes: string[] }, scope: string): boolean {
	return ctx.scopes.includes(scope);
}

// ============================================================================
// Input Schemas
// ============================================================================

export const ListTasksInputSchema = z.object({
	pageSize: z
		.number()
		.int()
		.min(1)
		.max(100)
		.default(20)
		.describe("Maximum number of tasks to return (1-100, default 20)"),
	cursor: z
		.string()
		.optional()
		.describe("Pagination cursor from previous response"),
	assigneeId: z
		.array(z.string())
		.optional()
		.describe("Filter by assignee user IDs"),
	statusId: z.array(z.string()).optional().describe("Filter by status IDs"),
	statusType: z
		.array(z.enum(["backlog", "to_do", "in_progress", "done", "review"]))
		.optional()
		.describe("Filter by status type"),
	projectId: z.array(z.string()).optional().describe("Filter by project IDs"),
	milestoneId: z
		.array(z.string())
		.optional()
		.describe("Filter by milestone IDs"),
	labels: z.array(z.string()).optional().describe("Filter by label IDs"),
	search: z
		.string()
		.optional()
		.describe("Search tasks by title or description"),
	responseFormat: z
		.enum(["json", "markdown"])
		.optional()
		.default("json")
		.describe(
			"Response format: 'json' for structured data, 'markdown' for human-readable text",
		),
});

export const GetTaskInputSchema = z.object({
	taskId: z.string().describe("The task ID or permalink ID to retrieve"),
	responseFormat: z
		.enum(["json", "markdown"])
		.optional()
		.default("json")
		.describe(
			"Response format: 'json' for structured data, 'markdown' for human-readable text",
		),
});

export const CreateTaskInputSchema = z.object({
	title: z.string().min(1).max(500).describe("Task title (required)"),
	description: z
		.string()
		.max(10000)
		.optional()
		.describe("Task description in markdown format"),
	assigneeId: z.string().optional().describe("User ID to assign the task to"),
	statusId: z
		.string()
		.describe(
			"Status ID for the task (required - use list_statuses to get available statuses)",
		),
	projectId: z
		.string()
		.nullable()
		.optional()
		.describe("Project ID to add the task to (null for no project)"),
	milestoneId: z
		.string()
		.nullable()
		.optional()
		.describe("Milestone ID to associate with the task"),
	priority: z
		.enum(["low", "medium", "high", "urgent"])
		.optional()
		.describe("Task priority level"),
	dueDate: z
		.string()
		.optional()
		.describe("Due date in ISO 8601 format (YYYY-MM-DD)"),
	labels: z
		.array(z.string())
		.optional()
		.describe("Array of label IDs to attach to the task"),
});

export const UpdateTaskInputSchema = z.object({
	taskId: z.string().describe("The task ID to update"),
	title: z.string().min(1).max(500).optional().describe("New task title"),
	description: z
		.string()
		.max(10000)
		.optional()
		.describe("New task description in markdown format"),
	assigneeId: z
		.string()
		.nullable()
		.optional()
		.describe("User ID to assign the task to (null to unassign)"),
	statusId: z.string().optional().describe("New status ID for the task"),
	projectId: z
		.string()
		.nullable()
		.optional()
		.describe("Project ID to move the task to (null to remove from project)"),
	milestoneId: z
		.string()
		.nullable()
		.optional()
		.describe("Milestone ID to associate with the task"),
	priority: z
		.enum(["low", "medium", "high", "urgent"])
		.optional()
		.describe("New task priority level"),
	dueDate: z
		.string()
		.optional()
		.describe("New due date in ISO 8601 format (YYYY-MM-DD)"),
	labels: z
		.array(z.string())
		.optional()
		.describe(
			"Array of label IDs to set on the task (replaces existing labels)",
		),
});

export const DeleteTaskInputSchema = z.object({
	taskId: z.string().describe("The task ID to delete"),
});

// Common response format schema for list operations
export const ListResponseFormatSchema = z.object({
	responseFormat: z
		.enum(["json", "markdown"])
		.optional()
		.default("json")
		.describe(
			"Response format: 'json' for structured data, 'markdown' for human-readable text",
		),
});

export const ListStatusesInputSchema = ListResponseFormatSchema.extend({});

export const ListLabelsInputSchema = ListResponseFormatSchema.extend({});

export const ListProjectsInputSchema = ListResponseFormatSchema.extend({});

export const ListMilestonesInputSchema = ListResponseFormatSchema.extend({
	projectId: z.string().optional().describe("Filter milestones by project ID"),
});
