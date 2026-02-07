import { tool } from "ai";
import z from "zod";

export const switchToolboxToolSchema = z.object({
	toolbox: z.string().describe("The name of the toolbox to switch to"),
});

export const switchToolboxTool = tool({
	description:
		"Switch to using a different set of tools (toolbox). This may extend your capabilities.",
	inputSchema: switchToolboxToolSchema,
	execute: async function* (input) {
		console.log(`Switching to toolbox ${input.toolbox}`);
		yield {
			text: `You have more tools available now from the ${input.toolbox} toolbox.`,
		};
	},
});
