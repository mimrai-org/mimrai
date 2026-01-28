import type { MimraiMcpServer } from "../server";
import { registerCreateTaskTool } from "./create-task";
import { registerDeleteTaskTool } from "./delete-task";
import { registerGetTaskTool } from "./get-task";
import { registerListLabelsTool } from "./list-labels";
import { registerListMilestonesTool } from "./list-milestones";
import { registerListProjectsTool } from "./list-projects";
import { registerListStatusesTool } from "./list-statuses";
import { registerListTasksTool } from "./list-tasks";
import { registerUpdateTaskTool } from "./update-task";

/**
 * MCP Context provided by OAuth token verification
 */
export interface McpContext {
	userId: string;
	teamId: string;
	scopes: string[];
}

export function registerTaskTools(
	server: MimraiMcpServer,
	getContext: () => McpContext,
) {
	registerListTasksTool(server, getContext);
	registerGetTaskTool(server, getContext);
	registerCreateTaskTool(server, getContext);
	registerUpdateTaskTool(server, getContext);
	registerDeleteTaskTool(server, getContext);
	registerListStatusesTool(server, getContext);
	registerListLabelsTool(server, getContext);
	registerListProjectsTool(server, getContext);
	registerListMilestonesTool(server, getContext);
}
