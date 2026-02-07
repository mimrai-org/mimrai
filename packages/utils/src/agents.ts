import { fetchModels } from "tokenlens";

export const AGENT_DEFAULT_NAME = "Mimir";
export const AGENT_DEFAULT_MODEL = "openai/gpt-5";

export interface Model {
	name: string;
	inputCostUSD: number;
	outputCostUSD: number;
}

export const promotedModels = [
	"xai/grok-4.1-fast-reasoning",
	"openai/gpt-5",
	"anthropic/claude-haiku-4.5",
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
		.sort((a, b) =>
			promotedModels.includes(a.name) && promotedModels.includes(b.name)
				? 0
				: promotedModels.includes(a.name)
					? -1
					: promotedModels.includes(b.name)
						? 1
						: a.name.localeCompare(b.name),
		);
};
