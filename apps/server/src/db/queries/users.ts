import { eq } from "drizzle-orm";
import { db } from "..";
import { users } from "../schema/schemas";

export const getUserById = async (userId: string) => {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	return user;
};
