import type { InferEnum } from "drizzle-orm/";
import type { teamRoleEnum } from "@/db/schema/schemas";

export const SCOPES = ["team:write"] as const;
export type Scope = (typeof SCOPES)[number];

export const roleScopes: Record<InferEnum<typeof teamRoleEnum>, Scope[]> = {
	owner: ["team:write"],
	member: [],
};
