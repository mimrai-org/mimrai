"use client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { Card, CardContent } from "@ui/components/ui/card";
import { SparklesIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";
import { trpc } from "@/utils/trpc";
import { SuggestionCard } from "../tasks-suggestions/suggestion-card";

export const SuggestionsWidget = () => {
	const user = useUser();
	const { data: autopilotSettings } = useQuery(
		trpc.autopilotSettings.get.queryOptions(),
	);

	const { data } = useQuery(
		trpc.tasksSuggestions.get.queryOptions({
			pageSize: 5,
			status: ["pending"],
		}),
	);

	return (
		<Card className="h-full border-0 bg-transparent shadow-none">
			<CardContent className="relative h-full">
				<AnimatePresence mode="popLayout">
					{data?.map((suggestion, index) => (
						<SuggestionCard
							key={suggestion.id}
							suggestion={suggestion}
							className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 min-h-[200px] w-full transform rounded-lg bg-card p-4 text-sm shadow-lg"
							showActions={index === data.length - 1}
							style={{
								filter: `contrast(${100 + (data.length - index - 1) * 3}%)`,
								rotateZ: `${4 * (index % 2 === 0 ? 1 : -1)}deg`,
							}}
						/>
					))}
				</AnimatePresence>
				{data?.length === 0 && autopilotSettings?.enabled && (
					<div className="flex h-full flex-col items-center justify-center">
						<p className="text-center text-muted-foreground text-sm">
							You're all caught up! <br /> No new suggestions at the moment.
						</p>
					</div>
				)}
				{data?.length === 0 && !autopilotSettings?.enabled && (
					<div className="flex h-full flex-col items-center justify-center">
						<p className="text-center text-muted-foreground text-sm">
							Enable Autopilot to get AI powered suggestions on your daily
							workflow.
						</p>
						<Link
							href={`${user?.basePath}/settings/autopilot`}
							className="mt-4 inline-block"
						>
							<Button size="sm">
								<SparklesIcon />
								Enable Autopilot
							</Button>
						</Link>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
