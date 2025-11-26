import { getAppUrl } from "./envs";

export const getShareablePermalink = (permalinkId: string) => {
	const url = new URL(`${getAppUrl()}/s/${permalinkId}`);
	return url.toString();
};
