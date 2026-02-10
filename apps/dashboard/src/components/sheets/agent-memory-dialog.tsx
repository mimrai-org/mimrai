"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@mimir/ui/dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/ui/badge";
import { Button } from "@ui/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/ui/collapsible";
import { Skeleton } from "@ui/components/ui/skeleton";
import { BrainIcon, TrashIcon } from "lucide-react";
import { useAgentParams } from "@/hooks/use-agent-params";
import { queryClient, trpc } from "@/utils/trpc";

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
	lesson: { label: "Lesson", color: "bg-blue-500/10 text-blue-500" },
	preference: {
		label: "Preference",
		color: "bg-purple-500/10 text-purple-500",
	},
	fact: { label: "Fact", color: "bg-green-500/10 text-green-500" },
	procedure: { label: "Procedure", color: "bg-orange-500/10 text-orange-500" },
};

export const AgentMemoryDialog = () => {
	const { agentMemoryId, setParams } = useAgentParams();

	const isOpen = Boolean(agentMemoryId);

	const { data: agent } = useQuery(
		trpc.agents.getById.queryOptions(
			{ id: agentMemoryId! },
			{ enabled: isOpen },
		),
	);

	const { data: memories, isFetching } = useQuery(
		trpc.agents.getMemories.queryOptions(
			{ agentId: agentMemoryId! },
			{ enabled: isOpen },
		),
	);

	const { mutate: deleteMemory } = useMutation(
		trpc.agents.deleteMemory.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.agents.getMemories.queryOptions({
						agentId: agentMemoryId!,
					}),
				);
			},
		}),
	);

	return (
		<Dialog open={isOpen} onOpenChange={() => setParams(null)}>
			<DialogContent className="max-h-[80vh] sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Agent Memory</DialogTitle>
					<DialogDescription>
						Inspect the memories accumulated by{" "}
						<span className="font-medium text-foreground">
							{agent?.name ?? "this agent"}
						</span>
						.
					</DialogDescription>
				</DialogHeader>

				<div className="max-h-[60vh] space-y-1 overflow-y-auto pr-1">
					{isFetching ? (
						Array.from({ length: 3 }).map((_, i) => (
							<Skeleton key={i} className="h-20 rounded-md" />
						))
					) : !memories || memories.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<BrainIcon className="mb-4 size-10 text-muted-foreground" />
							<p className="font-medium">No memories yet</p>
							<p className="mt-1 text-muted-foreground text-sm">
								This agent hasn't accumulated any memories from task executions.
							</p>
						</div>
					) : (
						memories.map((memory) => {
							const cat = CATEGORY_LABELS[memory.category] ?? {
								label: memory.category,
								color: "bg-muted text-muted-foreground",
							};

							return (
								<div
									key={memory.id}
									className="group relative space-y-2 rounded-sm p-4 hover:bg-accent dark:hover:bg-accent/30"
								>
									<div className="flex flex-wrap items-center gap-2">
										<Badge variant="secondary" className={cat.color}>
											{cat.label}
										</Badge>
										{memory.tags?.map((tag) => (
											<Badge key={tag} variant="outline" className="text-xs">
												{tag}
											</Badge>
										))}
										<span className="text-muted-foreground text-xs">
											Score: {memory.relevanceScore}
										</span>
									</div>
									<Collapsible>
										<CollapsibleTrigger className="collapsible-chevron inline items-center text-left">
											<span className="font-medium text-sm">
												{memory.title}
											</span>
										</CollapsibleTrigger>
										<CollapsibleContent>
											<p className="mt-2 whitespace-pre-wrap text-muted-foreground text-sm">
												{memory.content}
											</p>
										</CollapsibleContent>
									</Collapsible>
									<Button
										type="button"
										size="icon"
										variant="ghost"
										className="absolute top-2 right-2 size-7 opacity-0 transition-opacity group-hover:opacity-100"
										onClick={() => deleteMemory({ id: memory.id })}
									>
										<TrashIcon className="size-3.5" />
									</Button>
								</div>
							);
						})
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};
