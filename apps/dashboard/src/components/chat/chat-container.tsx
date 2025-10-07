"use client";
import { BotIcon, BotOffIcon } from "lucide-react";
import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useChatParams } from "@/hooks/use-chat-params";
import { cn } from "@/lib/utils";
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
			className={cn("h-full transition-[transform] duration-300", {
				"border-r": show,
			})}
			style={{
				width: show ? 700 : 0,
				// transform: show ? "none" : "translateX(-500px)",
			}}
		>
			<div className="h-full overflow-hidden">
				<ChatInterface id={chatId} />
			</div>
		</div>
	);
};
