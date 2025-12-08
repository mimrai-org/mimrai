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
	model?: string;
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

export const trackTaskCreated = async ({
	userId,
	teamId,
	teamName,
	source,
}: {
	userId: string;
	teamId: string;
	teamName?: string;
	source: string;
}) => {
	await op.track("task_created", {
		profileId: userId,
		source,
		teamId,
		teamName,
	});
};

export const trackFollowUp = async ({
	userId,
	teamId,
	teamName,
	message,
}: {
	userId: string;
	teamId: string;
	teamName?: string;
	message?: string;
}) => {
	await op.track("follow_up", {
		profileId: userId,
		teamId,
		teamName,
		message,
	});
};
