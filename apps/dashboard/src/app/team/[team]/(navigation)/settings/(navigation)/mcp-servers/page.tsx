"use client";
import { Button } from "@ui/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useMcpServerParams } from "@/hooks/use-mcp-server-params";
import { McpServerList } from "./mcp-server-list";

export default function Page() {
	const { setParams } = useMcpServerParams();

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-lg">MCP Servers</h2>
					<p className="text-muted-foreground text-sm">
						Manage MCP servers for integrations and AI tools.
					</p>
				</div>
				<div>
					<Button
						type="button"
						size="sm"
						onClick={() => setParams({ createMcpServer: true })}
					>
						<PlusIcon />
						Create MCP Server
					</Button>
				</div>
			</div>
			<McpServerList />
		</div>
	);
}
