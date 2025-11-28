import { getGoogleClient } from "@integration/google/client";
import { google } from "googleapis";

export const getGmailClient = () => {
	return google.gmail({ version: "v1", auth: getGoogleClient() });
};
