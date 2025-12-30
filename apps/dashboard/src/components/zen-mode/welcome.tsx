"use client";
import { Button } from "@ui/components/ui/button";
import { ArrowRightIcon, SunIcon } from "lucide-react";
import { motion, stagger } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { ZenModeQueueList } from "./queue";
import { useZenMode, type ZenModeTask } from "./use-zen-mode";

const container = {
	hidden: {},
	show: {},
};

const defaultItem = {
	hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
	show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export const ZenModeWelcome = ({
	user,
}: {
	user: {
		name?: string;
		team?: {
			slug?: string;
		};
	};
}) => {
	const { tasks } = useZenMode();
	const top3Tasks = tasks?.slice(0, 3) || [];

	return (
		<div className="overflow-hidden">
			<motion.div
				className="mx-auto flex h-screen flex-col items-center justify-center"
				initial="hidden"
				animate="show"
				variants={container}
				transition={{
					delayChildren: stagger(0.4),
				}}
			>
				<motion.div
					initial={{ rotate: 0 }}
					animate={{ rotate: 360 }}
					transition={{
						repeat: Number.POSITIVE_INFINITY,
						duration: 60,
						ease: "linear",
					}}
					className="size-[300px]"
				>
					<motion.div
						variants={{
							hidden: { opacity: 0, y: 50 },
							show: { opacity: 1, y: 0 },
						}}
						className="overflow-none relative"
						transition={{ duration: 1.2 }}
					>
						<Image
							src="/icons/sun.png"
							alt="Welcome to Zen Mode"
							className="dark:invert"
							width={300}
							height={300}
						/>
						<motion.div
							initial={{ scale: 5.0 }}
							animate={{ scale: 5.5 }}
							transition={{
								repeat: Number.POSITIVE_INFINITY,
								duration: 3,
								repeatType: "reverse",
							}}
							className="absolute inset-0 animate-blob rounded-full bg-radial-[50%_50%] from-yellow-500/10 via-red-400/5 to-transparent dark:from-yellow-100/10 dark:via-red-200/2"
						/>
					</motion.div>
				</motion.div>
				<motion.h1
					variants={defaultItem}
					className="mt-8 text-center font-thin text-4xl"
				>
					Good morning, {user?.name?.split(" ")[0]}!
				</motion.h1>

				<motion.p
					variants={defaultItem}
					className="mt-4 text-center font-light text-lg text-muted-foreground"
				>
					These are today's focus points
				</motion.p>

				<div className="mt-8 max-w-md space-y-1 font-light">
					<ZenModeQueueList tasks={top3Tasks} itemClassName="text-base py-2" />
				</div>

				<motion.div variants={defaultItem} className="mt-8">
					<Link href={`/team/${user.team?.slug}/zen/orientation`}>
						<Button
							size={"lg"}
							className="rounded-full font-normal transition-all hover:scale-105"
						>
							Start the day
							<SunIcon />
						</Button>
					</Link>
				</motion.div>
			</motion.div>
		</div>
	);
};
