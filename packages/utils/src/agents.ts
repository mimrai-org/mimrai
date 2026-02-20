import { fetchModels } from "tokenlens";

export const AGENT_DEFAULT_NAME = "Mimir";
export const AGENT_DEFAULT_MODEL = "anthropic/claude-haiku-4.5";

export interface Model {
	name: string;
	inputCostUSD: number;
	outputCostUSD: number;
}

export const promotedModels = [
	"openai/gpt-5",
	"openai/gpt-5.2-chat",
	"openai/gpt-5.2",
	"openai/gpt-5.1-instant",
	"openai/gpt-5.1-thinking",
	"openai/gpt-5.2-codex",
	"openai/gpt-5.1-codex",
	"openai/gpt-5-mini",
	"openai/gpt-4o",
	"openai/gpt-4o-mini",
	"anthropic/claude-haiku-4.5",
	"anthropic/claude-sonnet-4.5",
	"anthropic/claude-opus-4.6",
	"anthropic/claude-opus-4.5",
	"google/gemini-3-flash",
	"google/gemini-3-pro-preview",
	"google/gemini-2.5-pro",
	"google/gemini-2.5-flash",
];

export const getModels = async (): Promise<Model[]> => {
	const allModels = await fetchModels({
		provider: "vercel",
	});

	const providerModels = Object.values(allModels?.models || {});

	return providerModels
		.map((model) => {
			return {
				name: model.id,
				inputCostUSD: model.cost?.input ?? 0,
				outputCostUSD: model.cost?.output ?? 0,
			};
		})
		.filter((model) => promotedModels.includes(model.name));
};

export const formatToolName = (toolName: string) => {
	return toolName
		.replace(/^mcp:/, "")
		.replace(/[_-]+/g, " ")
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.toLowerCase()
		.trim();
};

export const HIDDEN_AGENT_INTEGRATIONS = [
	"taskManagement",
	"memory",
	"research",
];
