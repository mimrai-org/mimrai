import { google } from "@ai-sdk/google";
import type { InferUITools } from "ai";
import { getContext } from "./context";

// Tool registry function - this creates the actual tool implementations
export const createToolRegistry = () => {
	const context = getContext();

	return {
		web_search: google.tools.googleSearch({
			mode: "MODE_DYNAMIC",
		}),
	};
};

// Infer the UI tools type from the registry
export type UITools = InferUITools<ReturnType<typeof createToolRegistry>>;
