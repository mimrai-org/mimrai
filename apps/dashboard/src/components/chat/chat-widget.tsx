"use client";
import { AIDevtools } from "@ai-sdk-tools/devtools";
import { Provider, type UIMessage } from "@ai-sdk-tools/store";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { generateId } from "ai";
import { XIcon } from "lucide-react";
import { usePathname } from "next/navigation";
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
	toggle: (value) => {
		if (typeof window !== "undefined") {
			if (value === false) {
				window.document.body.style.overflow = "";
			} else {
				window.document.body.style.overflow = "hidden";
			}
		}
		set({ show: value !== undefined ? value : !get().show });
	},
	setChatId: (chatId) => set({ chatId }),
}));

export const ChatWidget = () => {
	const pathname = usePathname();
	const lastPathname = useRef<string>(pathname);
	const containerRef = useRef<HTMLDivElement>(null);
	const [hover, setHover] = useState(false);
	const { show, toggle, chatId, setChatId } = useChatWidget();

	useEffect(() => {
		if (pathname !== lastPathname.current) {
			// Close chat on route change
			toggle(false);
			setHover(false);
			lastPathname.current = pathname;
		}
	}, [pathname]);

	const {
		data: initialMessages,
		isFetched,
		isFetching,
	} = useQuery(
		trpc.chats.get.queryOptions(
			{
				chatId: chatId!,
			},
			{
				enabled: !!chatId,
				refetchOnWindowFocus: false,
				// select: (chat) => chat.sort((a, b) => a.timestamp - b.timestamp),
			},
		),
	);

	useEffect(() => {
		if (!isFetched) return;
		if (!containerRef.current) return;

		const handleMouseEnter = () => {
			setHover(true);
		};
		const handleMouseLeave = () => {
			setHover(false);
		};
		const handleClick = () => {
			toggle(true);
		};

		const textarea = containerRef.current?.querySelector("textarea");
		textarea?.addEventListener("mouseenter", handleMouseEnter);
		textarea?.addEventListener("mouseleave", handleMouseLeave);
		textarea?.addEventListener("click", handleClick);
		textarea?.addEventListener("focus", handleClick);

		return () => {
			textarea?.removeEventListener("mouseenter", handleMouseEnter);
			textarea?.removeEventListener("mouseleave", handleMouseLeave);
			textarea?.removeEventListener("click", handleClick);
			textarea?.removeEventListener("focus", handleClick);
		};
	}, [isFetched]);

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

		return () => {
			window.removeEventListener("keydown", closeHandler);
		};
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (chatId) {
			console.log("Storing chat ID:", chatId);
			window.localStorage.setItem("chat-id", chatId);
			return;
		}

		const storedChatId = window.localStorage.getItem("chat-id");
		if (storedChatId) {
			setChatId(storedChatId);
		} else {
			const newChatId = generateId();
			setChatId(newChatId);
			window.localStorage.setItem("chat-id", newChatId);
		}
	}, [chatId]);

	return (
		<div className="pointer-events-none fixed inset-0 z-10">
			<div
				className={cn("absolute inset-0 transition-all duration-300", {
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
			{!isFetching && (
				<Provider
					initialMessages={(initialMessages?.messages as UIMessage[]) ?? []}
				>
					<div
						ref={containerRef}
						className={cn(
							"-translate-x-1/2 pointer-events-none absolute bottom-0 left-1/2 h-screen pb-2 transition-[translate,min-height] duration-200",
							{
								"translate-y-[calc(65px)]": !show && !hover,
								"translate-y-[calc(40px)]": hover && !show,
								"pointer-events-auto h-screen": show,
							},
						)}
					>
						<div className="h-full w-[50vw] bg-transparent">
							{isFetched && <ChatInterface showMessages={show} id={chatId} />}
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
			)}
		</div>
	);
};
