import { getAppUrl } from "./envs";

export const getTaskPermalink = (permalinkId: string) => {
	const url = new URL(`${getAppUrl()}/t/${permalinkId}`);
	return url.toString();
};

export const getTaskMarkdownLink = (
	permalinkId: string,
	title: string,
	teamId?: string,
) => {
	const url = getTaskPermalink(permalinkId);
	return `[${title}](${url})`;
};
