"use client";
import { AIDevtools } from "@ai-sdk-tools/devtools";
import { Provider, type UIMessage } from "@ai-sdk-tools/store";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { generateId } from "ai";
import { XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { ChatInterface } from "./chat-interface";

export type ChatContainerState = {
	chatId?: string;
	show: boolean;
	toggle: (value?: boolean) => void;
	setChatId: (chatId: string) => void;
};

export const useChatWidget = create<ChatContainerState>()((set, get) => ({
	show: false,
	toggle: (value) => set({ show: value !== undefined ? value : !get().show }),
	setChatId: (chatId) => set({ chatId }),
}));

export const ChatWidget = () => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [hover, setHover] = useState(false);
	const { show, toggle, chatId, setChatId } = useChatWidget();

	const { data: initialMessages, isFetched } = useQuery(
		trpc.chats.get.queryOptions(
			{
				chatId: chatId!,
			},
			{
				enabled: !!chatId,
			},
		),
	);

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (chatId) return;

		const closeHandler = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				toggle(false);
				setHover(false);
				document.activeElement instanceof HTMLElement &&
					document.activeElement.blur();
			}
		};

		window.addEventListener("keydown", closeHandler);

		const storedChatId = window.localStorage.getItem("chat-id");
		if (storedChatId) {
			setChatId(storedChatId);
		} else {
			const newChatId = generateId();
			setChatId(newChatId);
			window.localStorage.setItem("chat-id", newChatId);
		}
		return () => {
			window.removeEventListener("keydown", closeHandler);
		};
	}, []);

	return (
		<Provider initialMessages={initialMessages?.messages as UIMessage[]}>
			<div className="pointer-events-none fixed inset-0 z-10">
				<div
					className={cn("absolute inset-0 transition-all", {
						"pointer-events-auto bg-background opacity-100": show,
						"pointer-events-none opacity-0": !show,
					})}
				>
					<div className="absolute top-8 right-8">
						<Button
							type="button"
							variant={"ghost"}
							size="sm"
							onClick={() => toggle(false)}
						>
							<XIcon />
						</Button>
					</div>
				</div>
				<div
					ref={containerRef}
					className={cn(
						"-translate-x-1/2 pointer-events-auto absolute bottom-0 left-1/2 pb-2 transition-all",
						{
							"translate-y-[calc(100%-50px)]": !show && !hover,
							"translate-y-[calc(100%-90px)]": hover && !show,
							"h-screen": show,
						},
					)}
					onMouseEnter={() => {
						setHover(true);
						// containerRef.current?.querySelector("textarea")?.focus();
					}}
					onMouseLeave={() => {
						setHover(false);
						// toggle(false);
						// containerRef.current?.querySelector("textarea")?.blur();
					}}
				>
					<div
						className="h-full w-[50vw] bg-transparent"
						onClick={(e) => {
							e.stopPropagation();
							toggle(true);
						}}
					>
						{isFetched && <ChatInterface showMessages={show} id={chatId} />}
					</div>
				</div>
			</div>
			{process.env.NODE_ENV === "development" && (
				<AIDevtools
					config={{
						streamCapture: {
							enabled: true,
							endpoint: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/chat`,
							autoConnect: true,
						},
					}}
				/>
			)}
		</Provider>
	);
};
