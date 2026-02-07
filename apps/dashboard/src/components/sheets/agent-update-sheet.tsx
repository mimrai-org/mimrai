"use client";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@mimir/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useAgentParams } from "@/hooks/use-agent-params";
import { trpc } from "@/utils/trpc";
import { AgentForm } from "../forms/agent-form";

export const AgentUpdateSheet = () => {
	const { agentId, setParams } = useAgentParams();

	const isOpen = Boolean(agentId);

	const { data: agent } = useQuery(
		trpc.agents.getById.queryOptions(
			{ id: agentId! },
			{
				enabled: isOpen,
			},
		),
	);

	return (
		<Dialog open={isOpen} onOpenChange={() => setParams(null)}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Update Agent</DialogTitle>
				</DialogHeader>
				{agent && (
					<AgentForm
						defaultValues={{
							id: agent.id,
							name: agent.name,
							description: agent.description || "",
							authorizeIntegrations: agent.authorizeIntegrations,
							activeToolboxes: agent.activeToolboxes || [],
							model: agent.model,
							soul: agent.soul || "",
						}}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
};
