"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@mimir/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useMcpServerParams } from "@/hooks/use-mcp-server-params";
import { trpc } from "@/utils/trpc";
import { McpServerForm } from "../forms/mcp-server-form";

export const McpServerUpdateSheet = () => {
	const { mcpServerId, setParams } = useMcpServerParams();

	const isOpen = Boolean(mcpServerId);

	const { data: server } = useQuery(
		trpc.mcpServers.getById.queryOptions(
			{ id: mcpServerId! },
			{
				enabled: isOpen,
			},
		),
	);

	const config = server?.config as
		| { url: string; headers?: Record<string, string>; scopes?: string[] }
		| undefined;

	const headers = config?.headers
		? Object.entries(config.headers).map(([key, value]) => ({ key, value }))
		: [];

	return (
		<Dialog open={isOpen} onOpenChange={() => setParams(null)}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit MCP Server</DialogTitle>
					<DialogDescription>
						Update the settings for your MCP server connection.
					</DialogDescription>
				</DialogHeader>
				{server && (
					<McpServerForm
						defaultValues={{
							id: server.id,
							name: server.name,
							description: server.description || "",
							transport: server.transport,
							url: config?.url || "",
							headers,
							scopes: config?.scopes?.join(" ") || "",
						}}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
};
