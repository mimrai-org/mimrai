"use client";

import type { UIMessage } from "ai";
import { useEffect, useRef } from "react";
import {
	AGENT_TOOL_METADATA,
	type ToolCacheKey,
} from "@/utils/agent-tool-metadata";
import {
	invalidateAgentsCache,
	invalidateDocumentsCache,
	invalidateLabelsCache,
	invalidateMilestonesCache,
	invalidateProjectsCache,
	invalidateTasksCache,
} from "./use-data-cache-helpers";

type MessagePart = UIMessage["parts"][number];

type ToolPartWithMetadata = MessagePart & {
	toolCallId?: string;
	toolName?: string;
	state?: string;
};

const CACHE_INVALIDATORS_BY_KEY: Record<ToolCacheKey, () => void> = {
	tasks: invalidateTasksCache,
	projects: invalidateProjectsCache,
	milestones: invalidateMilestonesCache,
	labels: invalidateLabelsCache,
	documents: invalidateDocumentsCache,
	agents: invalidateAgentsCache,
};

function isToolPart(part: MessagePart): part is ToolPartWithMetadata {
	const type = part.type as string;
	return type === "dynamic-tool" || type.startsWith("tool-");
}

function isCompletedToolPart(part: ToolPartWithMetadata) {
	return part.state === "output-available" || part.state === "output-error";
}

function getToolName(part: ToolPartWithMetadata): string | null {
	if (part.type === "dynamic-tool") {
		return part.toolName ?? null;
	}

	const type = part.type as string;
	return type.startsWith("tool-") ? type.replace(/^tool-/, "") : null;
}

function getToolCallKey(
	message: UIMessage,
	messageIndex: number,
	part: ToolPartWithMetadata,
	partIndex: number,
) {
	const messageKey = message.id || `assistant-${messageIndex}`;
	const toolCallId = part.toolCallId || `part-${partIndex}`;
	return `${messageKey}:${toolCallId}`;
}

export function useAgentToolCacheInvalidation(messages: UIMessage[]) {
	const seenCompletedToolCallsRef = useRef<Set<string>>(new Set());
	const hasInitializedRef = useRef(false);

	useEffect(() => {
		const completedToolCalls: Array<{ key: string; toolName: string }> = [];

		for (const [messageIndex, message] of messages.entries()) {
			if (message.role !== "assistant") {
				continue;
			}

			for (const [partIndex, part] of message.parts.entries()) {
				if (!isToolPart(part) || !isCompletedToolPart(part)) {
					continue;
				}

				const toolName = getToolName(part);
				if (!toolName) {
					continue;
				}

				completedToolCalls.push({
					key: getToolCallKey(message, messageIndex, part, partIndex),
					toolName,
				});
			}
		}

		// Seed with initial history to avoid invalidating cache for already-finished messages.
		if (!hasInitializedRef.current) {
			for (const call of completedToolCalls) {
				seenCompletedToolCallsRef.current.add(call.key);
			}
			hasInitializedRef.current = true;
			return;
		}

		for (const call of completedToolCalls) {
			if (seenCompletedToolCallsRef.current.has(call.key)) {
				continue;
			}

			seenCompletedToolCallsRef.current.add(call.key);

			const invalidateKeys =
				AGENT_TOOL_METADATA[call.toolName]?.invalidate ?? [];
			for (const key of invalidateKeys) {
				CACHE_INVALIDATORS_BY_KEY[key]();
			}
		}
	}, [messages]);
}
