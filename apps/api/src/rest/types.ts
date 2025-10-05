import type { Session } from "better-auth";

export type Context = {
	Variables: {
		session: Session;
		teamId: string;
		userId?: string;
	};
};
