"use client";

import { Button } from "@mimir/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@mimir/ui/popover";
import type { Editor } from "@tiptap/react";
import { Link2Icon, Link2OffIcon } from "lucide-react";
import { useRef, useState } from "react";
import { formatUrlWithProtocol } from "../../utils";
import { BubbleMenuButton } from "./bubble-menu-button";

interface LinkItemProps {
	editor: Editor;
	open: boolean;
	setOpen: (open: boolean) => void;
}

export function LinkItem({ editor, open, setOpen }: LinkItemProps) {
	const [value, setValue] = useState("");
	const isActive = editor.isActive("link");
	const inputRef = useRef<HTMLInputElement>(null);
	const linkValue = editor.getAttributes("link").href;

	const handleSubmit = () => {
		const url = formatUrlWithProtocol(value);

		if (url) {
			editor
				.chain()
				.focus()
				.extendMarkRange("link")
				.setLink({ href: url })
				.run();

			setOpen(false);
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<div className="h-9">
					<BubbleMenuButton
						isActive={isActive}
						action={() => setOpen(true)}
						className="h-full"
					>
						{linkValue ? (
							<Link2OffIcon className="size-4" />
						) : (
							<Link2Icon className="size-4" />
						)}
					</BubbleMenuButton>
				</div>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-60 p-0" sideOffset={10}>
				<div className="flex p-1">
					<input
						ref={inputRef}
						type="text"
						placeholder="Paste a link"
						className="h-7 flex-1 bg-background p-0.5 text-xs outline-none placeholder:text-[#878787]"
						defaultValue={linkValue || ""}
						onChange={(e) => setValue(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								handleSubmit();
							}
						}}
					/>

					{linkValue ? (
						<Button
							size="icon"
							variant="outline"
							type="button"
							className="flex size-7 items-center p-1 text-red-600 transition-all hover:border-none hover:bg-red-100 dark:hover:bg-red-800"
							onClick={() => {
								editor.chain().focus().unsetLink().run();
								if (inputRef.current) {
									inputRef.current.value = "";
								}
								setOpen(false);
							}}
						>
							<Link2OffIcon className="size-4" />
						</Button>
					) : (
						<Button
							size="icon"
							className="size-7"
							type="button"
							onClick={handleSubmit}
						>
							<Link2Icon className="size-4" />
						</Button>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
