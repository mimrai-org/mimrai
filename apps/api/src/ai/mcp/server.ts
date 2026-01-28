import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Mimrai MCP Server
 *
 * Exposes Mimrai task management operations to MCP clients.
 * All operations require proper OAuth authentication with appropriate scopes.
 */
export const createMcpServer = () => {
	const server = new McpServer({
		name: "mimrai-mcp-server",
		version: "1.0.0",
	});

	return server;
};

export type MimraiMcpServer = ReturnType<typeof createMcpServer>;
