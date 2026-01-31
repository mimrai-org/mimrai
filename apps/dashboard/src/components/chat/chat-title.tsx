import { AnimatePresence, motion } from "motion/react";
import { useDataPart } from "@/hooks/use-data-part";

export interface ChatTitleData {
	chatId: string;
	title: string;
}

export const ChatTitle = () => {
	const [data] = useDataPart<ChatTitleData>("chat-title");
	const chatTitle = data as ChatTitleData;

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -10 }}
				transition={{ duration: 0.2 }}
				className="w-fit"
			>
				<div className="flex items-center gap-2 text-foreground text-xs">
					<div className="whitespace-nowrap">
						{chatTitle?.title || "New conversation"}
					</div>
				</div>
			</motion.div>
		</AnimatePresence>
	);
};
