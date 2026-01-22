import { TargetIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGlobalSearch } from "../global-search-context";
import type { ResultItemProps } from "../types";
import { BaseResultItem } from "./base-result-item";

export const MilestoneResultItem = ({ item }: ResultItemProps) => {
	const router = useRouter();
	const { onOpenChange, basePath } = useGlobalSearch();

	const handleSelect = () => {
		router.push(`${basePath}/projects/${item.parentId}/tasks?mId=${item.id}`);
		onOpenChange(false);
	};

	return (
		<BaseResultItem
			onSelect={handleSelect}
			icon={TargetIcon}
			iconColor={item.color}
			title={item.title}
		/>
	);
};
