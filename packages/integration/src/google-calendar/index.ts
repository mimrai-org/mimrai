import crypto from "node:crypto";
import { getApiUrl } from "@mimir/utils/envs";

import { auth } from "googleapis/build/src/apis/oauth2";

export const oauth2Client = new auth.OAuth2(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
	`${getApiUrl()}/api/google-calendar/oauth/callback`,
);

const scopes = [
	"https://www.googleapis.com/auth/calendar.events.owned",
	"https://www.googleapis.com/auth/userinfo.email",
];

export const generateAuthUrl = () => {
	const state = crypto.randomBytes(32).toString("hex");

	const authorizationUrl = oauth2Client.generateAuthUrl({
		access_type: "offline",
		scope: scopes,
		include_granted_scopes: true,
		state: state,
	});

	return { authorizationUrl, state };
};

export * from "./create-event";
export * from "./delete-event";
export * from "./get-events";
export * from "./sync-event";
export * from "./update-event";
