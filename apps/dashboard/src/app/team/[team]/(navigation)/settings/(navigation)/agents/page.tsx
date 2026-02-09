"use client";
import { Button } from "@ui/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/ui/card";
import { PlusIcon } from "lucide-react";
import { useAgentParams } from "@/hooks/use-agent-params";
import { AgentsList } from "./agents-list";

export default function Page() {
	const { setParams } = useAgentParams();

	return (
		<Card>
			<CardHeader className="flex items-center justify-between">
				<div>
					<CardTitle>Agents</CardTitle>
					<CardDescription>
						Manage the agents that assist you in your tasks.
					</CardDescription>
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
			</CardHeader>
			<CardContent>
				<AgentsList />
			</CardContent>
		</Card>
	);
}
