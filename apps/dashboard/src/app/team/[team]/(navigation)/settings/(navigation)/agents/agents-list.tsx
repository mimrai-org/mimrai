"use client";

import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { Skeleton } from "@ui/components/ui/skeleton";
import {
	BotIcon,
	BrainIcon,
	EditIcon,
	EllipsisVerticalIcon,
	TrashIcon,
} from "lucide-react";
import { useMemo } from "react";
import { AssigneeAvatar } from "@/components/asignee-avatar";
import { useAgentParams } from "@/hooks/use-agent-params";
import { queryClient, trpc } from "@/utils/trpc";

export const AgentsList = () => {
	const { setParams } = useAgentParams();

	const { data, isFetching } = useInfiniteQuery(
		trpc.agents.get.infiniteQueryOptions(
			{
				pageSize: 20,
			},
			{
				getNextPageParam: (lastPage) => lastPage.meta.cursor,
			},
		),
	);

	const { mutate: deleteAgent } = useMutation(
		trpc.agents.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.agents.get.infiniteQueryOptions({ pageSize: 20 }),
				);
			},
		}),
	);

	const flatData = useMemo(() => {
		return data?.pages.flatMap((page) => page.data) ?? [];
	}, [data]);

	return (
		<div className="text-sm">
			{isFetching ? (
				Array.from({ length: 3 }).map((_, index) => (
					<Skeleton key={index} className="my-2 h-14 rounded-sm" />
				))
			) : flatData.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<BotIcon className="mb-4 size-12 text-muted-foreground" />
					<h3 className="mb-2 font-medium text-lg">No agents yet</h3>
					<p className="mb-4 max-w-sm text-muted-foreground">
						Create your first AI agent to help automate tasks and enhance your
						team's productivity.
					</p>
					<Button
						onClick={() => setParams({ createAgent: true })}
						className="w-fit"
					>
						Create Agent
					</Button>
				</div>
			) : (
				flatData.map((agent) => (
					<div
						key={agent.id}
						className="flex items-center gap-4 rounded-sm px-4 py-2 hover:bg-accent dark:hover:bg-accent/30"
					>
						<div>
							<AssigneeAvatar
								name={agent.name}
								email={agent.name}
								image={agent.avatar}
							/>
						</div>
						<div>
							<h3 className="font-medium">{agent.name}</h3>
							<p className="text-muted-foreground">
								{agent.description || "No description provided."}
							</p>
						</div>
						<div className="ml-auto flex items-center gap-2">
							<div className="text-muted-foreground">{agent.model}</div>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										type="button"
										size="sm"
										className="size-5"
										variant="ghost"
									>
										<EllipsisVerticalIcon />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem
										onClick={() => {
											queryClient.setQueryData(
												trpc.agents.getById.queryKey({ id: agent.id }),
												agent,
											);
											setParams({ agentId: agent.id });
										}}
									>
										<EditIcon />
										Edit
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => {
											queryClient.setQueryData(
												trpc.agents.getById.queryKey({ id: agent.id }),
												agent,
											);
											setParams({ agentMemoryId: agent.id });
										}}
									>
										<BrainIcon />
										Memory
									</DropdownMenuItem>
									<DropdownMenuItem
										variant="destructive"
										onClick={() => deleteAgent({ id: agent.id })}
									>
										<TrashIcon />
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				))
			)}
		</div>
	);
};
