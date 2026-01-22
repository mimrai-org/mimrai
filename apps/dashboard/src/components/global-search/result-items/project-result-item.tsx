import { useQuery } from "@tanstack/react-query";
import { BoxIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Response } from "@/components/chat/response";
import { trpc } from "@/utils/trpc";
import { useGlobalSearch } from "../global-search-context";
import type { ResultItemProps } from "../types";
import { BaseResultItem } from "./base-result-item";

export const ProjectResultItem = ({ item }: ResultItemProps) => {
	const router = useRouter();
	const { onOpenChange, basePath } = useGlobalSearch();

	const handleSelect = () => {
		router.push(`${basePath}/projects/${item.id}`);
		onOpenChange(false);
	};

	return (
		<BaseResultItem
			onSelect={handleSelect}
			icon={BoxIcon}
			preview={<ProjectResultPreview item={item} />}
			iconColor={item.color}
			title={item.title}
		/>
	);
};

export const ProjectResultPreview = ({ item }: ResultItemProps) => {
	const { data } = useQuery(
		trpc.projects.getById.queryOptions({ id: item.id }),
	);
	return (
		<div>
			<h2 className="font-medium text-xl">{item.title}</h2>
			<div className="text-muted-foreground text-sm">
				<Response>{data?.description || "No description available."}</Response>
			</div>
		</div>
	);
};
