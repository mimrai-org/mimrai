import { useChatActions, useDataPart } from "@ai-sdk-tools/store";
import { Button } from "@ui/components/ui/button";
import { AnimatePresence, motion } from "motion/react";
import { useChatWidget } from "./chat-widget";

type SuggestionsData = {
	prompts: string[];
};

const delay = 1;

export const ChatSuggestions = () => {
	const { show } = useChatWidget();
	const [suggestions, clearSuggestions] =
		useDataPart<SuggestionsData>("suggestions");
	const { sendMessage } = useChatActions();

	const handlePromptClick = (prompt: string) => {
		clearSuggestions();
		sendMessage({ text: prompt });
	};

	if (!show) {
		return null;
	}

	if (!suggestions?.prompts || suggestions.prompts.length === 0) {
		return null;
	}

	const prompts = suggestions.prompts;

	return (
		<AnimatePresence mode="wait">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: 10 }}
				transition={{ duration: 0.3, delay, ease: "easeOut" }}
				className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
			>
				{prompts.map((prompt, index) => (
					<motion.div
						key={prompt}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95 }}
						transition={{
							duration: 0.2,
							delay: delay + index * 0.05,
							ease: "easeOut",
						}}
					>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => handlePromptClick(prompt)}
							className="h-auto flex-shrink-0 whitespace-nowrap border px-2 py-1 font-normal text-[#666] text-xs"
						>
							{prompt}
						</Button>
					</motion.div>
				))}
			</motion.div>
		</AnimatePresence>
	);
};
