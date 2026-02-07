"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@mimir/ui/dialog";
import { useMcpServerParams } from "@/hooks/use-mcp-server-params";
import { McpServerForm } from "../forms/mcp-server-form";

export const McpServerCreateSheet = () => {
	const { createMcpServer, setParams } = useMcpServerParams();

	const isOpen = Boolean(createMcpServer);

	return (
		<Dialog open={isOpen} onOpenChange={() => setParams(null)}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add MCP Server</DialogTitle>
					<DialogDescription>
						Connect to an MCP server to sync data between Mimrai and other
						tools.
					</DialogDescription>
				</DialogHeader>
				<McpServerForm />
			</DialogContent>
		</Dialog>
	);
};
