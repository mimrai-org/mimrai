import { db } from "@db/index";
import { getColumns } from "@db/queries/columns";
import {
	getConnectedRepositoryByInstallationId,
	getConnectedRepositoryByRepoId,
} from "@db/queries/github";
import { installIntegration } from "@db/queries/integrations";
import { getTasks, updateTask } from "@db/queries/tasks";
import { tasks } from "@db/schema";
import { OpenAPIHono } from "@hono/zod-openapi";
import { log } from "@mimir/integration/logger";
import { getAppUrl } from "@mimir/utils/envs";
import type {
	IssuesOpenedEvent,
	PushEvent,
	WebhookEvent,
	WebhookEventName,
} from "@octokit/webhooks-types";
import { generateObject } from "ai";
import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import type { MiddlewareHandler } from "hono";
import z from "zod";
import { protectedMiddleware } from "../middleware";
import type { Context } from "../types";

const app = new OpenAPIHono<Context>();

const validateGithubWebhook: MiddlewareHandler = async (c, next) => {
	const signature = c.req.header("X-Hub-Signature-256");
	const rawBody = await c.req.text();
	const secret = process.env.GITHUB_WEBHOOK_SECRET;

	if (!signature || !rawBody || !secret) {
		return c.json({ ok: false }, 400);
	}

	const hmac = crypto.createHmac("sha256", secret);
	hmac.update(rawBody);
	const generatedSignature = `sha256=${hmac.digest("hex")}`;

	if (
		crypto.timingSafeEqual(
			Buffer.from(signature),
			Buffer.from(generatedSignature),
		)
	) {
		await next();
	} else {
		return c.json({ ok: false }, 401);
	}
};

app.post(validateGithubWebhook, async (c) => {
	const event = c.req.header("X-GitHub-Event") as WebhookEventName;
	const body = await c.req.json();
	switch (event) {
		case "push": {
			// Handle push event
			const payload = body as PushEvent;
			const repositoryId = payload.repository.id;
			const branchRef = payload.ref; // refs/heads/main
			const branchName = branchRef.replace("refs/heads/", "");
			const intallationId = payload.installation?.id;

			if (!intallationId) {
				console.log("No installation ID found in the payload");
				break;
			}

			const connectedRepository = await getConnectedRepositoryByInstallationId({
				installationId: intallationId,
				repoId: repositoryId,
			});

			if (!connectedRepository) {
				console.log("Repository not connected");
				break;
			}

			const branches = connectedRepository.branches || [];
			if (!branches.includes(branchName)) {
				console.log("Branch is connected");
				break;
			}

			//Handle the logic for the push event on the connected branch
			console.log(`Push event on connected branch: ${branchName}`);

			const teamId = connectedRepository.teamId;
			const messages = payload.commits.map((commit) => commit.message);
			const allMessages = messages.join("\n");

			const columns = (
				await getColumns({
					teamId,
					pageSize: 20,
				})
			).data.map((column) => ({
				id: column.id,
				name: column.name,
				description: column.description,
				isFinalState: column.isFinalState,
			}));

			const taskTitles = (
				await getTasks({
					pageSize: 20,
					teamId,
					columnId: columns
						.filter((col) => !col.isFinalState)
						.map((col) => col.id),
				})
			).data.map((task) => ({
				id: task.id,
				title: task.title,
				columnId: task.columnId,
			}));

			const response = await generateObject({
				model: "openai/gpt-4o",
				schema: z.object({
					updates: z.array(
						z.object({
							taskId: z.string().describe("ID of the task to move"),
							columnId: z
								.string()
								.describe("ID of the column to move the task to"),
						}),
					),
				}),
				prompt: `You are an AI assistant that helps update tasks in a project management system based on commit messages from a git repository.
				You have a list of tasks with their IDs, titles, and current column IDs:
				${JSON.stringify(taskTitles, null, 2)}

				You also have a list of columns with their IDs, names, and descriptions:
				${JSON.stringify(columns, null, 2)}

				Based on the following commit messages of a push from repository ${payload.repository.full_name}, determine which tasks need to be moved to which columns.
				Commit Messages:
				${allMessages}

				For each commit message, if it clearly relates to a task title, create an update object with the taskId and the columnId to move it to.
				If a commit message does not relate to any task, do not create an update for it.
				Only include updates for tasks that need to be moved.
				Keep in mind the descriptions of the columns to determine the most appropriate column for each task. But almost all updates should go to the final state column.

				Return the updates as an array of objects with taskId and columnId.`,
				temperature: 0.2,
			});

			const updates = response.object.updates;
			console.log("Task updates to perform:", updates);

			for (const update of updates) {
				await updateTask({
					id: update.taskId,
					columnId: update.columnId,
				});
			}

			console.log(response.usage);
			log(
				connectedRepository.integrationId,
				"info",
				`Processed push event on ${branchName} with ${updates.length} task updates`,
				{
					repository: payload.repository.full_name,
				},
				response.usage.inputTokens,
				response.usage.outputTokens,
			);

			break;
		}

		default: {
			console.log(`Unhandled event type: ${event}`);
			break;
		}
	}

	return c.json({ ok: true });
});

app.get("/setup", ...protectedMiddleware, async (c) => {
	const session = c.get("session");
	const teamId = c.get("teamId");
	const code = c.req.query("code");
	const installationId = c.req.query("installation_id");

	// get github access token
	const response = await fetch("https://github.com/login/oauth/access_token", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify({
			client_id: process.env.GITHUB_CLIENT_ID,
			client_secret: process.env.GITHUB_CLIENT_SECRET,
			code,
		}),
	});

	const data = (await response.json()) as { access_token: string };

	console.log("GitHub access token response:", data);

	// Create the integration with the access token
	const integration = await installIntegration({
		type: "github",
		teamId: teamId!,
		config: {
			token: data.access_token,
			installationId,
		},
	});

	return c.redirect(
		`${getAppUrl()}/dashboard/settings/integrations/${integration.type}`,
	);
});

export { app as githubWebhook };
