"use client";

import { Button } from "@ui/components/ui/button";
import { Input } from "@ui/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/ui/popover";
import { ScrollArea } from "@ui/components/ui/scroll-area";
import { cn } from "@ui/lib/utils";
import { XIcon } from "lucide-react";
import Image from "next/image";
import { type ComponentType, useMemo, useState } from "react";
import {
	getIconEntry,
	type IconEntry,
	iconRegistry,
} from "@/utils/resource-icons";

export type ResourceIconPickerProps = {
	/** Currently selected icon key */
	value: string | null | undefined;
	/** Called when user picks an icon (or clears) */
	onChange: (key: string | null) => void;
	/** Fallback icon shown in the trigger when nothing is selected */
	fallback: ComponentType<{ className?: string }>;
	/** Additional class names for the trigger button */
	className?: string;
};

function renderIconPreview(entry: IconEntry, className?: string) {
	switch (entry.type) {
		case "emoji":
			return (
				<span
					className={cn(
						"inline-flex items-center justify-center leading-none",
						className,
					)}
				>
					{entry.value}
				</span>
			);
		case "image":
			return (
				<Image
					src={entry.value}
					alt="icon"
					width={40}
					height={40}
					className={cn("object-contain", className)}
				/>
			);
		case "component": {
			const Icon = entry.value;
			return <Icon className={className} />;
		}
	}
}

/**
 * A popover-based grid picker for resource icons.
 * Supports search filtering and category grouping.
 */
export function ResourceIconPicker({
	value,
	onChange,
	fallback: Fallback,
	className,
}: ResourceIconPickerProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");

	const currentEntry = getIconEntry(value);

	const filteredCategories = useMemo(() => {
		const query = search.toLowerCase().trim();
		if (!query) return iconRegistry.categories;

		return iconRegistry.categories
			.map((category) => {
				const filtered = Object.entries(category.icons).filter(
					([key, entry]) =>
						key.toLowerCase().includes(query) ||
						(entry.type === "emoji" && entry.value.includes(query)) ||
						category.label.toLowerCase().includes(query),
				);
				if (filtered.length === 0) return null;
				return {
					...category,
					icons: Object.fromEntries(filtered),
				};
			})
			.filter(Boolean) as typeof iconRegistry.categories;
	}, [search]);

	const handleSelect = (key: string) => {
		onChange(key);
		setOpen(false);
		setSearch("");
	};

	const handleClear = () => {
		onChange(null);
		setOpen(false);
		setSearch("");
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className={cn(
						"size-8 shrink-0 rounded-md hover:bg-accent",
						className,
					)}
				>
					{currentEntry ? (
						renderIconPreview(currentEntry, "size-full")
					) : (
						<Fallback className="size-full" />
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="w-72 p-0"
				onCloseAutoFocus={(e) => e.preventDefault()}
			>
				{/* Search + Clear */}
				<div className="flex items-center gap-1 border-b p-2">
					<Input
						placeholder="Search icons..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="h-7 text-xs"
						autoFocus
					/>
					{value && (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="size-7 shrink-0"
							onClick={handleClear}
						>
							<XIcon className="size-3.5" />
						</Button>
					)}
				</div>

				{/* Grid */}
				<ScrollArea className="max-h-64 overflow-y-auto">
					<div className="p-2">
						{filteredCategories.length === 0 && (
							<p className="py-4 text-center text-muted-foreground text-xs">
								No icons found
							</p>
						)}
						{filteredCategories.map((category) => (
							<div key={category.label} className="mb-2 last:mb-0">
								<p className="mb-1 px-1 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
									{category.label}
								</p>
								<div className="grid grid-cols-8 gap-0.5">
									{Object.entries(category.icons).map(([key, entry]) => (
										<button
											key={key}
											type="button"
											onClick={() => handleSelect(key)}
											className={cn(
												"flex size-8 items-center justify-center rounded-sm transition-colors hover:bg-accent",
												value === key &&
													"bg-accent ring-1 ring-accent-foreground/20",
											)}
										>
											{renderIconPreview(entry, "size-5")}
										</button>
									))}
								</div>
							</div>
						))}
					</div>
				</ScrollArea>
			</PopoverContent>
		</Popover>
	);
}
