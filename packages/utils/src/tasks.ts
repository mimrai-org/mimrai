import { getAppUrl } from "./envs";

export const getTaskUrl = (taskId: string, teamId?: string) => {
	const url = new URL(`${getAppUrl()}/dashboard/workstation/${taskId}`);
	if (teamId) url.searchParams.set("teamId", teamId);
	return url.toString();
};

export const getTaskMarkdownLink = (
	taskId: string,
	title: string,
	teamId?: string,
) => {
	const url = getTaskUrl(taskId, teamId);
	return `[${title}](${url})`;
};
