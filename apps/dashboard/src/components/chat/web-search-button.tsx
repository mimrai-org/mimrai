"use client";

import { cn } from "@ui/lib/utils";
import { GlobeIcon } from "lucide-react";
import React from "react";
import { useChatStore } from "@/store/chat";

export function WebSearchButton() {
	const { isWebSearch, setIsWebSearch } = useChatStore();

	return (
		<button
			type="button"
			onClick={() => setIsWebSearch(!isWebSearch)}
			className={cn(
				"flex cursor-pointer items-center transition-colors duration-200",
				isWebSearch
					? "rounded-none bg-[rgba(0,0,0,0.05)] pr-2 hover:bg-[rgba(0,0,0,0.08)] dark:bg-[rgba(255,255,255,0.05)] dark:hover:bg-[rgba(255,255,255,0.08)]"
					: "hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)]",
			)}
		>
			<span className="flex size-8 items-center justify-center">
				<GlobeIcon
					size={16}
					className={cn(
						"transition-colors",
						isWebSearch
							? "text-black dark:text-white"
							: "text-[#707070] hover:text-[#999999] dark:text-[#666666] dark:hover:text-[#999999]",
					)}
				/>
			</span>
			<span
				className={cn(
					"overflow-hidden whitespace-nowrap font-medium text-[12px] text-black leading-[14px] transition-all duration-200 dark:text-white",
					isWebSearch
						? "ml-0.5 max-w-[100px] opacity-100"
						: "ml-0 max-w-0 opacity-0",
				)}
			>
				Search
			</span>
		</button>
	);
}
