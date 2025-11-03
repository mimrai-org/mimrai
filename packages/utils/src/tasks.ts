import { getAppUrl } from "./envs";

export const getTaskUrl = (taskId: string) => {
	return `${getAppUrl()}/dashboard/board?taskId=${taskId}`;
};

export const getTaskMarkdownLink = (taskId: string, title: string) => {
	const url = getTaskUrl(taskId);
	return `[${title}](${url})`;
};
