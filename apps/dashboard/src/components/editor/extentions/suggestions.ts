import type { Editor, ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import type React from "react";
import { queryClient, trpc } from "@/utils/trpc";
import { MentionList } from "./mention-list";
import { TaskMentionList } from "./task-mention-list";

type SuggestionItem<T = unknown> = {
	char: string;
	type: string;
	fetcher: (props: { query: string; editor: Editor }) => Promise<T[]>;
	listComponent: React.ComponentType<SuggestionProps>;
};

export const suggestionsOptions: SuggestionItem[] = [
	{
		char: "@",
		type: "user",
		fetcher: async ({ query, editor }) => {
			const members = await queryClient.fetchQuery(
				trpc.teams.getMembers.queryOptions({
					includeSystemUsers: true,
					isMentionable: true,
				}),
			);
			return members
				.filter((member) =>
					member.name.toLowerCase().includes(query.toLowerCase()),
				)
				.slice(0, 5);
		},
		listComponent: MentionList,
	},
	{
		char: "/t ",
		type: "task",
		fetcher: async ({ query, editor }) => {
			const tasks = await queryClient.fetchQuery(
				trpc.tasks.get.queryOptions({
					search: query,
					pageSize: 5,
				}),
			);
			return tasks.data;
		},
		listComponent: TaskMentionList,
	},
];
