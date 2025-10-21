import z from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
  description: z.string().max(500).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
});

export const updateTeamSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  email: z.email("Invalid email address").optional(),
  description: z.string().max(500).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
});

export const getTeamInviteByIdSchema = z.object({
  inviteId: z.string(),
});

export const acceptTeamInviteSchema = z.object({
  inviteId: z.string(),
});

export const createTeamInviteSchema = z.object({
  email: z.email(),
});

export const getTeamInvitesSchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.number().min(1).max(100).optional(),
});

export const removeMemberSchema = z.object({
  userId: z.string(),
});

export const transferOwnershipSchema = z.object({
  userId: z.string(),
});

export const updateMemberSchema = z.object({
  userId: z.string(),
  description: z.string().max(100).optional(),
});

export const getMemberByIdSchema = z.object({
  userId: z.string(),
});

export const deleteTeamInviteSchema = z.object({
  inviteId: z.string(),
});
