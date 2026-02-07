"use client";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@mimir/ui/dialog";
import { useAgentParams } from "@/hooks/use-agent-params";
import { AgentForm } from "../forms/agent-form";

export const AgentCreateSheet = () => {
	const { createAgent, setParams } = useAgentParams();

	const isOpen = Boolean(createAgent);

	return (
		<Dialog open={isOpen} onOpenChange={() => setParams(null)}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Agent</DialogTitle>
				</DialogHeader>
				<AgentForm />
			</DialogContent>
		</Dialog>
	);
};
