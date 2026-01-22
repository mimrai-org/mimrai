import { CornerDownLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useProjectParams } from "@/hooks/use-project-params";
import { useTaskParams } from "@/hooks/use-task-params";
import { useGlobalSearch } from "../global-search-context";
import type { ResultItemProps } from "../types";
import { BaseResultItem } from "./base-result-item";

export const ActionResultItem = ({ item }: ResultItemProps) => {
	const router = useRouter();
	const { onOpenChange, basePath } = useGlobalSearch();
	const { setParams: setTaskParams } = useTaskParams();
	const { setParams: setProjectParams } = useProjectParams();

	const handleSelect = () => {
		switch (item.id) {
			case "action:view-projects": {
				router.push(`${basePath}/projects`);
				break;
			}
			case "action:create-task": {
				setTaskParams({ createTask: true });
				break;
			}
			case "action:create-project": {
				setProjectParams({ createProject: true });
				break;
			}
			default:
				break;
		}
		onOpenChange(false);
	};

	return (
		<BaseResultItem
			onSelect={handleSelect}
			icon={CornerDownLeftIcon}
			iconColor={item.color}
			title={item.title}
		/>
	);
};
