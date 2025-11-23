export type ContextItem = {
	type: string;
	id: string;
	label: string;
	key: string;
};

export const formatLLMContextItem = (item: ContextItem) => {
	return `- ${item.type} (ID: ${item.id}, Label: ${item.label})`;
};

export const formatLLMContextItems = (items: Array<ContextItem>) => {
	if (items.length === 0) {
		return "";
	}

	return items.map(formatLLMContextItem).join("\n");
};
