import { differenceInBusinessDays } from "date-fns";
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

export const taskSignals = {
	overdue: {
		label: "Expired",
		priority: 1,
		eval: ({ dueDate }: { dueDate: string | null }) => {
			if (!dueDate) return false;
			const due = new Date(dueDate);
			const now = new Date();
			return due < now;
		},
	},
	urgent: {
		label: "Urgent",
		priority: 2,
		eval: ({ priority }: { priority: string | null }) => {
			return priority === "urgent";
		},
	},
	inactive: {
		label: "Inactive",
		priority: 3,
		eval: ({ updatedAt }: { updatedAt: string | null }) => {
			if (!updatedAt) return false;
			const lastActivity = new Date(updatedAt);
			const now = new Date();
			const diffInDays = differenceInBusinessDays(now, lastActivity);
			return diffInDays >= 30;
		},
	},
};

export type TaskSignalKey = keyof typeof taskSignals;

export const evaluateTaskSignals = (task: {
	dueDate: string | null;
	priority: string | null;
	updatedAt: string | null;
}) => {
	const activeSignals: TaskSignalKey[] = [];

	(Object.keys(taskSignals) as TaskSignalKey[]).forEach((signalKey) => {
		const signal = taskSignals[signalKey];
		if (signal.eval(task)) {
			activeSignals.push(signalKey);
		}
	});

	return activeSignals
		.map((signalKey) => ({
			label: taskSignals[signalKey].label,
			priority: taskSignals[signalKey].priority,
			key: signalKey,
		}))
		.sort((a, b) => {
			return b.priority - a.priority;
		});
};
