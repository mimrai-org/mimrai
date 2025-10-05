"use client";
import { BotIcon, BotOffIcon } from "lucide-react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Button } from "../ui/button";
import { ChatInterface } from "./chat-interface";

export type ChatContainerState = {
	show: boolean;
	toggle: () => void;
};

export const useChatContainer = create<ChatContainerState>()(
	persist(
		(set, get) => ({
			show: false,
			toggle: () => set({ show: !get().show }),
		}),
		{
			name: "chat",
			storage: createJSONStorage(() => localStorage),
		},
	),
);

export const ChatContainer = ({ chatId }: { chatId?: string }) => {
	const { show, toggle } = useChatContainer();

	return (
		<div
			className="h-full border-r transition-[transform] duration-300"
			style={{
				width: show ? 700 : 0,
				// transform: show ? "none" : "translateX(-500px)",
			}}
		>
			<Button
				className="fixed bottom-4 size-12 rounded-full"
				onClick={toggle}
				style={{
					left: show ? 500 : 24,
				}}
			>
				{show ? (
					<BotOffIcon className="size-4" />
				) : (
					<BotIcon className="size-4" />
				)}
			</Button>
			<div className="h-full overflow-hidden">
				<ChatInterface id={chatId} />
			</div>
		</div>
	);
};
