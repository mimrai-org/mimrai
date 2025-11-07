import { OpenPanel } from "@openpanel/sdk";

export const op = new OpenPanel({
	clientId: process.env.OPENPANEL_CLIENT_ID!,
	clientSecret: process.env.OPENPANEL_CLIENT_SECRET!,
});

export const trackMessage = ({
	userId,
	teamName,
	source,
}: {
	userId: string;
	teamName?: string;
	source: string;
}) => {
	op.track("message", {
		profileId: userId,
		source,
		teamName,
	});
};
