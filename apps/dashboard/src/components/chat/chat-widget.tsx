"use client";
import { AIDevtools } from "@ai-sdk-tools/devtools";
import { Provider, type UIMessage } from "@ai-sdk-tools/store";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { generateId } from "ai";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { XIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { create } from "zustand";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { ChatInterface } from "./chat-interface";

export type ChatContainerState = {
	chatId?: string;
	title?: string;
	show: boolean;
	hover?: boolean;
	toggle: (value?: boolean) => void;
	setHover: (hover: boolean) => void;
	setTitle: (title: string) => void;
	setChatId: (chatId: string) => void;
};

export const useChatWidget = create<ChatContainerState>()((set, get) => ({
	show: false,
	hover: false,
	setHover: (hover) => set({ hover }),
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
	setTitle: (title) => set({ title }),
}));

export const ChatWidget = () => {
	const pathname = usePathname();

	const lastPathname = useRef<string>(pathname);
	const containerRef = useRef<HTMLDivElement>(null);
	const { show, toggle, chatId, setChatId, setTitle, setHover, hover } =
		useChatWidget();

	const { scrollY } = useScroll();
	const [scrollingDown, setScrollingDown] = useState(false);
	const lastScrollY = useRef(0);
	useMotionValueEvent(scrollY, "change", (latest) => {
		if (latest > lastScrollY.current) {
			setScrollingDown(true);
		} else {
			setScrollingDown(false);
		}
		lastScrollY.current = latest;
	});

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
			},
		),
	);

	useEffect(() => {
		setTitle(initialMessages?.title || "");
	}, [initialMessages]);

	useHotkeys("ctrl+Enter", () => {
		toggle();
	});

	useHotkeys(
		"esc",
		() => {
			toggle(false);
			setHover(false);
			document.activeElement instanceof HTMLElement &&
				document.activeElement.blur();
		},
		{
			enableOnContentEditable: true,
			enableOnFormTags: true,
		},
	);

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (chatId) {
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
		<div
			className={cn("pointer-events-none fixed inset-0", {
				"z-50": show,
				"z-10": !show,
			})}
		>
			<div
				className={cn("absolute inset-0 transition-all duration-300", {
					"pointer-events-auto bg-sidebar-inset/95 opacity-100 backdrop-blur-sm":
						show,
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
					<motion.div
						ref={containerRef}
						variants={{
							show: {
								height: "100vh",
								translateY: -10,
							},
							default: {
								translateY: 0,
							},
							hover: {
								translateY: -5,
							},
							scroll: {
								translateY: 60,
							},
						}}
						transition={{
							type: "spring",
							stiffness: 300,
							damping: 30,
						}}
						initial="default"
						animate={show ? "show" : scrollingDown ? "scroll" : "default"}
						whileHover={show ? undefined : "hover"}
						className={cn(
							"-translate-x-1/2 pointer-events-none absolute bottom-0 left-1/2 h-screen pb-2",
							{
								"pointer-events-auto": show,
							},
						)}
					>
						<div className="hidden h-full w-3xl bg-transparent md:block">
							{isFetched && <ChatInterface showMessages={show} id={chatId} />}
						</div>
					</motion.div>
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
