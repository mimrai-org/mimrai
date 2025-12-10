"use client";
import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { GlobalSearchDialog } from "./global-search-dialog";

export const NavSearch = () => {
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

	return (
		<>
			<button
				type="button"
				onClick={() => {
					setOpen(true);
				}}
				className="flex w-48 items-center gap-4 rounded-md px-3 py-2 text-start text-muted-foreground text-sm transition-colors hover:text-foreground"
			>
				<SearchIcon className="size-4" />
				Find anything...
			</button>
			<GlobalSearchDialog open={open} onOpenChange={setOpen} />
		</>
	);
};
