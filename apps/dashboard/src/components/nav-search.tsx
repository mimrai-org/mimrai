"use client";
import { Input } from "@ui/components/ui/input";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useTaskParams } from "@/hooks/use-task-params";
import { GlobalSearchDialog } from "./global-search-dialog";

export const NavSearch = () => {
	const router = useRouter();
	const { setParams: setTaskParams } = useTaskParams();
	const [open, setOpen] = useState(false);

	useHotkeys(
		"mod+k",
		(e) => {
			e.preventDefault();
			setOpen((o) => !o);
		},
		{
			enableOnContentEditable: true,
		},
	);

	const handleNavigate = (item: {
		id: string;
		type: string;
		parentId?: string | null;
	}) => {
		switch (item.type) {
			case "task":
				// navigate to task
				setTaskParams({ taskId: item.id });
				break;
			case "project":
				// navigate to project
				router.push(`/dashboard/projects/${item.id}/detail`);
				break;
			case "milestone":
				// navigate to milestone
				router.push(
					`/dashboard/projects/${item.parentId}/tasks?mId=${item.id}`,
				);
				break;
			default:
				break;
		}
	};

	return (
		<>
			<button
				type="button"
				onClick={() => {
					setOpen(true);
				}}
				className="flex w-48 items-center gap-4 rounded-md px-3 py-2 text-start text-muted-foreground text-sm hover:bg-accent dark:hover:bg-accent/30"
			>
				<SearchIcon className="size-4" />
				Search anything...
			</button>
			<GlobalSearchDialog
				open={open}
				onOpenChange={setOpen}
				onSelect={handleNavigate}
			/>
		</>
	);
};
