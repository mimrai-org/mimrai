import { experimental_createMCPClient } from "@ai-sdk/mcp";
import { db } from "@mimir/db/client";
import { getIntegrationByType } from "@mimir/db/queries/integrations";
import { activities, tasks } from "@mimir/db/schema";
import { generateText, stepCountIs } from "ai";
import { and, eq } from "drizzle-orm";

export const createTaskPullRequest = async ({
	taskId,
	teamId,
}: {
	taskId: string;
	teamId: string;
}) => {
	const integration = await getIntegrationByType({
		type: "github",
		teamId,
	});

	if (!integration) {
		throw new Error("GitHub integration not found");
	}
	const token = integration.config.token;

	const copilotMCP = await experimental_createMCPClient({
		transport: {
			type: "http",
			url: "https://api.githubcopilot.com/mcp/",

			headers: {
				Authorization: `Bearer ${token}`,
				"X-MCP-Toolsets": "copilot",
			},
		},
		name: "github-copilot",
	});

	const copilotTools = await copilotMCP.tools();
	const tools = {
		...copilotTools,
	};

	const [task] = await db
		.select()
		.from(tasks)
		.where(and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)));

	if (!task.repositoryName) {
		throw new Error("Task does not have a repository associated");
	}

	const comments = await db
		.select()
		.from(activities)
		.where(
			and(
				eq(activities.groupId, taskId),
				eq(activities.teamId, teamId),
				eq(activities.type, "task_comment"),
			),
		)
		.limit(20);

	if (!task) {
		throw new Error("Task not found");
	}

	const response = await generateText({
		model: "openai/gpt-4o",
		// @ts-expect-error
		tools,
		activeTools: ["create_pull_request_with_copilot"],
		stopWhen: stepCountIs(3),
		messages: [
			{
				role: "user",
				content: `@github create a pull request that addresses the task described.
							<rules>
							- Respect the repository's contribution guidelines and coding style.
							- If the request is ambiguous, make reasonable assumptions but document them in the PR description.
              - Use the task title as the PR title.
              - Use the task description and comments to inform the PR description.
              - Do not create multiple pull requests. JUST CREATE ONE PR.
							</rules>
              <task-context>
                <title>${task.title}</title>
                <description>${task.description}</description>
                <comments>
                  ${comments.map((comment) => `<comment>${comment.metadata?.comment}</comment>`).join("\n")}
                </comments>
              </task-context>
              <repository>${task.repositoryName}</repository>
							<branch>${task.branchName}</branch>
              <response-format>
                - Use friendly and clear language.
                - Provide the PR URL in the response.
              </response-format>
						`,
			},
		],
	});

	return response.text;
};
