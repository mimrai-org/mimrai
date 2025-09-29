import { type BaseContext, createTypedContext } from "@ai-sdk-tools/artifacts";
import type { db } from "@/db";
import type { ChatUserContext } from "./chat-cache";

interface ChatContext extends BaseContext {
	db: typeof db;
	user: ChatUserContext;
}

export const { setContext, getContext } = createTypedContext<ChatContext>();
