import { priorityEnum } from "@db/schema";
import z from "zod";
import { paginationSchema } from "./base";

export enum TaskView {
  board = "board",
  backlog = "backlog",
}
export const taskViewEnum = z.enum([...Object.values(TaskView)]);

export const getTasksSchema = z.object({
  ...paginationSchema.shape,
  assigneeId: z.array(z.string()).optional(),
  columnId: z.array(z.string()).optional(),
  teamId: z.string().optional(),
  search: z.string().optional(),
  labels: z.array(z.string()).optional(),
  view: z.enum(["board", "backlog"]).optional(),
  recurring: z.boolean().optional(),
});
export type GetTasksInput = z.infer<typeof getTasksSchema>;

export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(50_000).optional(),
  assigneeId: z.string().nullable().optional(),
  columnId: z.string(),
  order: z.number().optional(),
  priority: z.enum(priorityEnum.enumValues).optional(),
  labels: z.array(z.string()).optional(),
  dueDate: z.string().nullable().optional(),
  mentions: z.array(z.string()).optional(),
  recurring: z
    .object({
      startDate: z.string().optional(),
      frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
      interval: z.number().min(1).max(365),
    })
    .nullable()
    .optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(50_000).optional(),
  assigneeId: z.string().nullable().optional(),
  priority: z.enum(priorityEnum.enumValues).optional(),
  dueDate: z.string().nullable().optional(),
  order: z.number().optional(),
  columnId: z.string().optional(),
  labels: z.array(z.string()).optional(),
  mentions: z.array(z.string()).optional(),
  recurring: z
    .object({
      frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
      interval: z.number().min(1).max(365),
      endDate: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const deleteTaskSchema = z.object({
  id: z.string(),
  teamId: z.string().optional(),
});
export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;

export const commentTaskSchema = z.object({
  id: z.string(),
  comment: z.string().min(1).max(5000),
});

export const smartCompleteSchema = z.object({
  prompt: z.string().min(1).max(5000),
});

export const smartCompleteResponseSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(255)
    .describe("Title of the task, must be self explanatory"),
  description: z
    .string()
    .max(50_000)
    .optional()
    .describe("Detailed description of the task"),
  priority: z
    .enum(priorityEnum.enumValues)
    .optional()
    .describe("Priority of the task"),
  dueDate: z
    .string()
    .optional()
    .describe("Due date of the task in ISO 8601 format"),
  labels: z
    .array(z.string())
    .optional()
    .describe(
      "Array of IDs labels to assign to the task. Always try to apply at least one label"
    ),
  assigneeId: z
    .string()
    .optional()
    .describe("ID of the user to assign the task to"),
});

export const getDuplicatedTasksSchema = z.object({
  title: z.string().min(1).max(255),
});

export const getTaskSubscribersSchema = z.object({
  id: z.string(),
});

export const unsubscribeTaskSchema = z.object({
  id: z.string(),
});

export const subscribeTaskSchema = z.object({
  id: z.string(),
  userId: z.string(),
});
