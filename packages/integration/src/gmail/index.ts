import crypto from "node:crypto";
import { getApiUrl } from "@mimir/utils/envs";

import { auth } from "googleapis/build/src/apis/oauth2";

export const createOAuth2Client = () =>
	new auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		`${getApiUrl()}/api/gmail/oauth/callback`,
	);

export const oauth2Client = createOAuth2Client();

const scopes = [
	"https://www.googleapis.com/auth/userinfo.email",
	"https://www.googleapis.com/auth/gmail.readonly",
	"https://www.googleapis.com/auth/gmail.compose",
];

export const generateAuthUrl = () => {
	const state = crypto.randomBytes(32).toString("hex");

	const authorizationUrl = oauth2Client.generateAuthUrl({
		access_type: "offline",
		scope: scopes,
		include_granted_scopes: false,
		state: state,
	});

	return { authorizationUrl, state };
};

export * from "./create-draft-email";
export * from "./decode";
export * from "./handle";
export * from "./process";
export * from "./send-draft-email";
export * from "./watch";
