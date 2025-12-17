"use client";

import { AnimatedStatus } from "@/components/animated-status";
import type { AgentStatus } from "@/types/agents";
import { getStatusMessage, getToolMessage } from "@/utils/agent-utils";
import Loader from "../loader";

interface ChatStatusIndicatorsProps {
	agentStatus: AgentStatus | null;
	currentToolCall: string | null;
	status?: string;
	currentSection?: string | null;
	bankAccountRequired?: boolean;
	hasTextContent?: boolean;
}

export function ChatStatusIndicators({
	agentStatus,
	currentToolCall,
	status,
}: ChatStatusIndicatorsProps) {
	const statusMessage = getStatusMessage(agentStatus);
	const toolMessage = getToolMessage(currentToolCall);

	const displayMessage = toolMessage || statusMessage;

	return (
		<div className="flex h-8 items-center">
			<AnimatedStatus
				text={displayMessage ?? null}
				shimmerDuration={0.75}
				fadeDuration={0.1}
				variant="slide"
				className="font-normal text-xs"
			/>

			{((agentStatus && !getStatusMessage(agentStatus)) ||
				(status === "submitted" && !agentStatus && !currentToolCall)) && (
				<Loader className="size-4" />
			)}
		</div>
	);
}
