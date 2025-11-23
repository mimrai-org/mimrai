import { OpenPanel } from "@openpanel/sdk";

export const op = new OpenPanel({
	clientId: process.env.OPENPANEL_CLIENT_ID!,
	clientSecret: process.env.OPENPANEL_CLIENT_SECRET!,
});

export const trackMessage = async ({
	userId,
	model,
	teamId,
	teamName,
	source,
	input,
	output,
}: {
	userId: string;
	teamId: string;
	teamName?: string;
	model: string;
	source: string;
	input?: number;
	output?: number;
}) => {
	await op.track("message", {
		profileId: userId,
		source,
		model,
		teamId,
		teamName,
		input,
		output,
	});
};
