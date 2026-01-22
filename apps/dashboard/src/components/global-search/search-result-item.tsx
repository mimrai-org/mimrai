import { ActionResultItem } from "./result-items/action-result-item";
import { MilestoneResultItem } from "./result-items/milestone-result-item";
import { NavigationResultItem } from "./result-items/navigation-result-item";
import { ProjectResultItem } from "./result-items/project-result-item";
import { TaskResultItem } from "./result-items/task-result-item";
import type { GlobalSearchItem } from "./types";

type SearchResultItemProps = {
	item: GlobalSearchItem;
};

export const SearchResultItem = ({ item }: SearchResultItemProps) => {
	const isAction = item.id === "action" || item.id.startsWith("action:");

	if (isAction) {
		return <ActionResultItem item={item} />;
	}

	switch (item.type) {
		case "task":
			return <TaskResultItem item={item} />;
		case "project":
			return <ProjectResultItem item={item} />;
		case "milestone":
			return <MilestoneResultItem item={item} />;
		case "navigation":
			return <NavigationResultItem item={item} />;
		default:
			return <TaskResultItem item={item} />;
	}
};
