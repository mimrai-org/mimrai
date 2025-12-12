import { openai } from "@ai-sdk/openai";
import { statusTypeEnum } from "@db/schema";
import { generateObject } from "ai";
import { color } from "bun";
import z from "zod";

export const generateWorkflow = async ({
	whatYourTeamDoes,
	howIsYourWorkflow,
}: {
	whatYourTeamDoes: string;
	howIsYourWorkflow: string;
}) => {
	const response = await generateObject({
		model: openai("gpt-5-mini"),

		system: `You are an expert workflow consultant. Your job is to help teams optimize their workflows based on their descriptions inside MIMRAI.
MIMRAI is a platform that helps teams manage their projects efficiently by providing customizable workflows.
MIMRAI have the following features to help teams manage their workflows (dot not invent features, MIMRAI only has the features listed below):
- Custom Statuses: Teams can create custom statuses to track the progress of their tasks.
- Labels: Teams can use labels to categorize and prioritize their tasks.
- Projects: Teams can organize their tasks into projects for better management.
- Milestones: Teams can set milestones to track important deadlines and goals.			
- Kanban Boards: Teams can visualize their workflow using Kanban boards.
- Project Timelines: Teams can plan and schedule their tasks using project timelines.
- Task Dependencies: Teams can set dependencies between tasks to ensure proper sequencing.
- Prioritization: Teams can prioritize their tasks based on their importance and urgency.

<guidelines>
- Respond in the given information locale (language) only.
- Use names and descriptions according to team activity and context.
- Do not use labels if you can use statuses to achieve the same goal.
- Use a maximum of 5 statuses.
- Use a maximum of 5 labels.
- Do not use labels for prioritization, priorities are already a built-in feature of MIMRAI.
- Each status must have a unique name.
- Each label must have a unique name and a HEX color code.
- Ensure that the suggested workflow is practical and easy to implement within MIMRAI.
- Do not mention MIMRAI in the workflow steps. it's implied.
</guidelines>
`,
		prompt: `Given the following information about a team:
    
    1. What the team does
    ${whatYourTeamDoes}
    2. How their current workflow operates
    ${howIsYourWorkflow}

    Provide a detailed recommendation on how they can improve their workflow for better efficiency and productivity inside MIMRAI.
    `,
		schema: workflowSuggestion,
	});

	return response.object;
};

export const workflowSuggestion = z.object({
	statuses: z
		.array(
			z.object({
				name: z.string(),
				description: z.string(),
				order: z
					.number()
					.min(1)
					.describe("The order of the status in the workflow"),
				type: z.enum(statusTypeEnum.enumValues),
			}),
		)
		.describe("A list of recommended statuses for the team's workflow"),
	labels: z
		.array(
			z.object({
				name: z.string(),
				description: z.string(),
				color: z.string().describe("HEX color code for the label"),
			}),
		)
		.describe("A list of recommended tags for the team's workflow"),

	workflow: z
		.array(
			z.object({
				description: z
					.string()
					.describe(
						"Description of the workflow step. Include relevant statuses and labels where applicable. Do not add numbering.",
					),
			}),
		)
		.describe(
			"A detailed workflow (step by step) plan for the team. Include statuses and labels where relevant.",
		),
	teamDescription: z
		.string()
		.describe(
			"A brief description of the team's main activities. This will help contextualize the workflow.",
		),

	additionalRecommendations: z
		.string()
		.max(500)
		.describe(
			"Any additional recommendations for improving the team's workflow. Max 500 characters.",
		),
});

export const stringifyWorkflow = (
	workflow: z.infer<typeof workflowSuggestion>,
) => {
	return `
Description:
${workflow.teamDescription}

Workflow:
${workflow.workflow
	.map((step, index) => `${index + 1}. ${step.description}`)
	.join("\n")}
`;
};
