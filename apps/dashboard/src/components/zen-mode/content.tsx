import { useMutation } from "@tanstack/react-query";
import { QuoteIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { trpc } from "@/utils/trpc";
import { Editor } from "../editor";
import { ZenModeInlineCommentList } from "./inline-comments/list";
import { useZenMode } from "./use-zen-mode";

export const ZenModeContent = () => {
	const { contentRef, currentTask, editorRef, updateTask } = useZenMode();
	const lastUpdatedValue = useRef(currentTask.description || "");
	const [contentValue, setContentValue] = useState(
		currentTask.description || "",
	);

	const debounceUpdateTask = useDebounceCallback(updateTask, 500);

	useEffect(() => {
		setContentValue(currentTask.description || "");
	}, [currentTask.description]);

	useEffect(() => {
		if (contentValue === lastUpdatedValue.current) return;
		debounceUpdateTask({
			id: currentTask.id,
			description: contentValue,
		});
		lastUpdatedValue.current = contentValue;
	}, [contentValue, currentTask.id]);

	return (
		<div
			className="relative w-full self-start px-2 text-start text-foreground text-sm leading-6 sm:px-4 sm:text-lg sm:leading-7"
			ref={contentRef}
		>
			<div className="-left-12 absolute top-0 hidden text-zinc-800 md:block">
				<QuoteIcon className="h-8 w-8 opacity-20" />
			</div>
			<Editor
				className="editor-xl"
				autoFocus={false}
				taskId={currentTask.id}
				value={contentValue}
				onChange={setContentValue}
				ref={editorRef}
			/>
			<ZenModeInlineCommentList />
		</div>
	);
};
