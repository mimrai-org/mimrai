import z from "zod";
import { is, ta } from "zod/v4/locales";

export const getChecklistItemsSchema = z.object({
  search: z.string().optional(),
  taskId: z.string().optional(),
});

export const createChecklistItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  assigneeId: z.string().optional(),
  taskId: z.string().optional(),
});

export const updateChecklistItemSchema = z.object({
  id: z.string(),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  isCompleted: z.boolean().optional(),
});

export const getChecklistItemByIdSchema = z.object({
  id: z.string(),
});

export const deleteChecklistItemSchema = z.object({
  id: z.string(),
});
