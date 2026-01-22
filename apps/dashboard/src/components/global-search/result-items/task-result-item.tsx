import { useQuery } from "@tanstack/react-query";
import { LayersIcon } from "lucide-react";
import { Response } from "@/components/chat/response";
import { useTaskParams } from "@/hooks/use-task-params";
import { trpc } from "@/utils/trpc";
import { useGlobalSearch } from "../global-search-context";
import type { ResultItemProps } from "../types";
import { BaseResultItem } from "./base-result-item";

export const TaskResultItem = ({ item }: ResultItemProps) => {
	const { onOpenChange } = useGlobalSearch();
	const { setParams: setTaskParams } = useTaskParams();

	const handleSelect = () => {
		setTaskParams({ taskId: item.id });
		onOpenChange(false);
	};

	return (
		<BaseResultItem
			onSelect={handleSelect}
			icon={LayersIcon}
			preview={<TaskResultPreview item={item} />}
			iconColor={item.color}
			title={item.title}
		/>
	);
};

export const TaskResultPreview = ({ item }: ResultItemProps) => {
	const { data: task } = useQuery(
		trpc.tasks.getById.queryOptions({
			id: item.id,
		}),
	);

	return (
		<div>
			<h2 className="mb-2 font-medium text-xl">{item.title}</h2>
			<div className="text-sm">
				<Response>{task?.description || "No description available."}</Response>
			</div>
		</div>
	);
};
