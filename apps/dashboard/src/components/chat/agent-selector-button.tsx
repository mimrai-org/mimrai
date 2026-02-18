"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@mimir/ui/dropdown-menu";
import { cn } from "@ui/lib/utils";
import { useAgents } from "@/hooks/use-data";
import { useChatStore } from "@/store/chat";
import { AssigneeAvatar } from "../asignee-avatar";

export function AgentSelectorButton() {
	const { selectedAgentId, setSelectedAgentId } = useChatStore();

	const { data: agentsData } = useAgents();

	const agents = agentsData?.data || [];
	const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className={cn(
						"group flex cursor-pointer items-center gap-1 rounded-sm pr-2 transition-colors duration-200 hover:bg-accent dark:hover:bg-accent/30",
					)}
				>
					<span className="flex size-8 items-center justify-center">
						<AssigneeAvatar
							name={selectedAgent?.name || "Mimir"}
							className="size-5"
						/>
					</span>
					<span
						className={cn(
							"whitespace-nowrap font-medium text-foreground text-xs leading-[14px] transition-all duration-200",
						)}
					>
						{selectedAgent?.name || "Mimir"}
					</span>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="min-w-[180px]">
				{agents.map((agent) => (
					<DropdownMenuItem
						key={agent.id}
						onClick={() => setSelectedAgentId(agent.id)}
						className="flex items-center gap-2"
					>
						<AssigneeAvatar name={agent.name} />
						<div>
							<span>{agent.name}</span>
							<p className="max-w-xs text-muted-foreground">
								{agent.description || "No description"}
							</p>
						</div>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
