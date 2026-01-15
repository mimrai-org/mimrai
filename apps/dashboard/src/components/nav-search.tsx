"use client";
import { Kbd, KbdGroup } from "@ui/components/ui/kbd";
import { cn } from "@ui/lib/utils";
import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { GlobalSearchDialog } from "./global-search-dialog";

export const NavSearch = ({
	placeholder,
	className,
}: {
	placeholder?: string;
	className?: string;
}) => {
	const [open, setOpen] = useState(false);

	useHotkeys(
		"ctrl+p, meta+p",
		(e) => {
			e.preventDefault();
			setOpen((o) => !o);
		},
		{
			enableOnContentEditable: true,
		},
	);

	return (
		<>
			<button
				type="button"
				onClick={() => {
					setOpen(true);
				}}
				className={cn(
					"flex w-52 items-center gap-4 rounded-md px-3 py-2 text-start text-muted-foreground text-sm transition-colors hover:text-foreground",
					className,
				)}
			>
				<SearchIcon className="size-4" />
				{placeholder || "Find anything..."}
				<Kbd className="ml-auto">
					<KbdGroup>
						<span>⌘</span>
						<span>P</span>
					</KbdGroup>
				</Kbd>
			</button>
			<GlobalSearchDialog open={open} onOpenChange={setOpen} />
		</>
	);
};
