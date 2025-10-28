import { Tooltip, TooltipContent, TooltipTrigger } from "@mimir/ui/tooltip";
import Image from "next/image";
import { ChatWidgetWithoutMimir } from "../chat-widget";

export const ContentSection = () => {
	return (
		<section className="relative flex w-screen gap-12 bg-background text-background-foreground">
			<FloatingIcons />
			<Borders />
			<div className="px-4 py-8 sm:px-0">
				<div className="text-base sm:text-lg">
					Hi there! I'm the developer behind MIMRAI. After trying every project
					management tool out there, I got tired of
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="underline">
								configuring boards, setting up automations, filling dozens of
								fields…
							</span>
						</TooltipTrigger>
						<TooltipContent>
							<p>Yeah... you probably know what I'm talking about</p>
						</TooltipContent>
					</Tooltip>{" "}
					just to move one task forward. I wanted to create a tool that
					simplifies task management using AI, so you can focus on what really
					matters.
					<br />
					<br />
					<div className="w-fit border px-2 py-1 text-base uppercase">
						The task manager you have been waiting for
					</div>
					<ol className="mt-2 ml-8 max-w-lg list-decimal space-y-2">
						<li className="">
							Create tasks from{" "}
							<Tooltip>
								<TooltipTrigger asChild>
									<span className="underline">anywhere</span>
								</TooltipTrigger>
								<TooltipContent>
									<p>Slack, Mattermost, Whatsapp, Telegram, and more</p>
								</TooltipContent>
							</Tooltip>{" "}
							with the help of AI.
						</li>
						<li>
							AI handles task prioritization and assignment based on your
							preferences, so you don't have to worry about it.
						</li>
						<li>
							Keep your team in the loop with automatic status updates and
							notifications in your preferred communication channels.
						</li>
					</ol>
					<br />
					<div className="mt-8 text-center">
						<div className="font-medium font-runic text-4xl sm:text-6xl">
							Improve Your Workflow
						</div>
						<div className="mt-4">
							Let's accept it, if your workflow looks like this right now, you
							need MIMRAI
						</div>
						<div className="my-4">
							<ChatWidgetWithoutMimir />
						</div>
					</div>
					<div className="mt-4 text-center">
						<div className="mx-auto my-8 h-16 w-[1px] bg-input" />
						<div className="font-medium font-runic text-4xl sm:text-6xl">
							Clean UI, Powerful AI
						</div>
						<div className="mx-auto mt-4 max-w-xl">
							With MIMRAI, creating and managing tasks is as simple as chatting.
							But you can also use the UI to have more control
						</div>
						<div className="relative mx-auto my-12 w-fit">
							<div className="-inset-2 absolute border" />
							<Image
								className="w-full"
								width={800}
								height={400}
								alt="Mimir board"
								src={"/images/chat.png"}
							/>
						</div>
					</div>
				</div>
			</div>
			<Borders />
		</section>
	);
};

const Borders = () => {
	return (
		<div className="hidden w-[30%] auto-cols-fr grid-flow-col sm:grid">
			{new Array(8).fill(0).map((_, idx) => (
				<div
					key={idx}
					className="h-full border-foreground/50 border-r border-dashed"
					style={{ left: `${(idx / 5) * 250}px` }}
				/>
			))}
		</div>
	);
};

const FloatingIcons = () => {
	return (
		<div className="pointer-events-none absolute inset-0 hidden xl:block">
			<div className="absolute top-[10%] left-8 size-36 opacity-40">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="0.2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="h-full w-full rotate-15"
				>
					<path d="M8 2v4" />
					<path d="M12 2v4" />
					<path d="M16 2v4" />
					<rect width="16" height="18" x="4" y="4" rx="2" />
					<path d="M8 10h6" />
					<path d="M8 14h8" />
					<path d="M8 18h5" />
				</svg>
			</div>
			<div className="absolute top-[50%] right-8 size-36 opacity-40">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="0.2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="size-full rotate-12"
				>
					<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
					<path d="M8 10v4" />
					<path d="M12 10v2" />
					<path d="M16 10v6" />
				</svg>
			</div>
		</div>
	);
};
