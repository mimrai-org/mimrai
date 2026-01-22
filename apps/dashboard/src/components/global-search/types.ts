import type { ReactNode } from "react";

export type GlobalSearchItem = {
	id: string;
	type: string;
	title: string;
	color?: string;
	parentId?: string | null;
	href?: string;
	teamId: string;
};

export type ResultItemProps = {
	item: GlobalSearchItem;
};

export type PreviewRenderer = (item: GlobalSearchItem) => ReactNode;
