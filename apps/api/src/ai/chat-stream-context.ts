import { createResumableStreamContext } from "resumable-stream";

export const chatResumableStreamContext = createResumableStreamContext({
	waitUntil: null,
	keyPrefix: "mimir:chat-stream",
});
