"use client";
import type { RouterOutputs } from "@mimir/trpc";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { cn } from "@ui/lib/utils";
import { formatRelative } from "date-fns";
import { Maximize2Icon } from "lucide-react";
import { motion, stagger } from "motion/react";
import Link from "next/link";
import { useUser } from "@/components/user-provider";
import { trpc } from "@/utils/trpc";
import { getNotificationItemProps } from "../notifications/list";
import { useZenMode } from "./use-zen-mode";

const container = {
	hidden: {},
	show: {},
};

const defaultItem = {
	hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
	show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export const ZenModeOrientation = ({
	initialData,
}: {
	initialData: RouterOutputs["zen"]["orientation"];
}) => {
	const { currentTask } = useZenMode();
	const user = useUser();
	const pageSize = 5;
	const { data } = useQuery(
		trpc.zen.orientation.queryOptions(undefined, {
			initialData,
		}),
	);

	const dataTruncated = data?.activities.slice(0, pageSize);

	return (
		<div className="h-screen">
			<div className="">
				<motion.div
					className="mx-auto flex h-screen flex-col items-center justify-center"
					initial="hidden"
					animate="show"
					variants={container}
					transition={{
						delayChildren: stagger(0.4),
					}}
				>
					<motion.h1
						variants={defaultItem}
						className="text-center font-thin text-4xl"
					>
						While you were away...
					</motion.h1>
					<motion.p
						variants={defaultItem}
						className="mt-2 text-center font-light text-lg text-muted-foreground"
					>
						Only items that may need your attention
					</motion.p>

					<div className="mt-8 w-full max-w-md">
						{dataTruncated.map((item, index) => {
							const props = getNotificationItemProps({
								activity: {
									...item.activities,
									// @ts-expect-error
									user: item.user,
								},
								user,
							});

							const isOther = index > 0;

							if (!props) return null;

							return (
								<motion.div
									key={index}
									variants={defaultItem}
									className={cn("group relative w-full px-2 py-1 text-base", {
										"text-xs": isOther,
										"mb-2 rounded-md bg-accent": !isOther,
									})}
								>
									<div
										className={cn("flex justify-between", {
											hidden: isOther,
										})}
									>
										<span className="truncate font-light">{props.title}</span>
									</div>
									<div className="flex items-center justify-start gap-2 text-xs">
										<div className="truncate text-muted-foreground">
											{props?.description}
										</div>
									</div>
									<span className="absolute top-0 right-0 translate-x-[calc(100%+0.5rem)] text-muted-foreground text-xs opacity-0 transition-opacity group-hover:opacity-100">
										{props.createdAt &&
											formatRelative(new Date(props.createdAt), new Date())}
									</span>
								</motion.div>
							);
						})}
					</div>

					<Link href={`${user?.basePath}/zen/${currentTask.id}`}>
						<Button
							type="button"
							size="lg"
							className="mt-8 rounded-full font-normal transition-all hover:scale-105"
						>
							Begin focus
							<Maximize2Icon />
						</Button>
					</Link>
				</motion.div>
			</div>
		</div>
	);
};
