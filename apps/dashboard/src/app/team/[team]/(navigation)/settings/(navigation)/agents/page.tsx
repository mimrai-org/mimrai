"use client";
import { Button } from "@ui/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useAgentParams } from "@/hooks/use-agent-params";
import { AgentsList } from "./agents-list";

export default function Page() {
	const { setParams } = useAgentParams();

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-lg">Agents</h2>
					<p className="text-muted-foreground text-sm">
						Manage the agents that assist you in your tasks.
					</p>
				</div>
				<div>
					<Button
						type="button"
						size="sm"
						onClick={() => setParams({ createAgent: true })}
					>
						<PlusIcon />
						Create Agent
					</Button>
				</div>
			</div>
			<AgentsList />
		</div>
	);
}
