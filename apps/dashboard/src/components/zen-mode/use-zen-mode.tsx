"use client";
import type { RouterInputs, RouterOutputs } from "@api/trpc/routers";
import {
	type UseMutateFunction,
	useMutation,
	useQuery,
} from "@tanstack/react-query";
import type { Editor as EditorInstance } from "@tiptap/react";
import { redirect, useRouter } from "next/navigation";
import { createContext, useContext, useRef } from "react";
import { useUser } from "@/hooks/use-user";
import { trpc } from "@/utils/trpc";
import { ZenModeLoading } from "./loading";
import { ZenModeNotFound } from "./not-found";

export type Task = RouterOutputs["tasks"]["get"]["data"][number];

interface ZenModeState {
	currentTask: Task;
	setCurrentTask: (taskId: string) => void;
	next: () => void;
	tasks: Task[];
	contentRef: React.RefObject<HTMLDivElement | null>;
	editorRef: React.RefObject<EditorInstance | null>;
	updateTask: UseMutateFunction<
		RouterOutputs["tasks"]["update"],
		unknown,
		RouterInputs["tasks"]["update"],
		unknown
	>;
}

export const ZenModeContext = createContext<ZenModeState | null>(null);

export const ZenModeProvider = ({
	children,
	taskId,
}: {
	children: React.ReactNode;
	taskId: string;
}) => {
	const user = useUser();
	const router = useRouter();
	const contentRef = useRef<HTMLDivElement>(null);
	const editorRef = useRef<EditorInstance | null>(null);

	const { data: tasks, isLoading } = useQuery(
		trpc.tasks.getZenModeQueue.queryOptions(undefined, {
			enabled: !!user,
			refetchOnWindowFocus: false,
			refetchOnMount: false,
		}),
	);

	const { mutate: updateTask } = useMutation(
		trpc.tasks.update.mutationOptions(),
	);

	if (isLoading) {
		return <ZenModeLoading />;
	}

	if (!tasks || tasks.data.length === 0) {
		return <ZenModeNotFound />;
	}

	const currentTask = tasks.data.find((task) => task.id === taskId);

	const handleNext = () => {
		if (!currentTask) return;
		const nextTaskIndex =
			tasks.data.findIndex((task) => task.id === currentTask!.id) + 1;
		if (nextTaskIndex < tasks.data.length) {
			const nextTask = tasks.data[nextTaskIndex]!;
			router.push(`${user?.basePath}/zen/${nextTask.id}`);
		} else {
			router.push(`${user?.basePath}/board`);
		}
	};

	const handleSetCurrentTask = (newTaskId: string) => {
		const taskExists = tasks.data.some((task) => task.id === newTaskId);
		if (taskExists) {
			router.push(`${user?.basePath}/zen/${newTaskId}`);
		} else {
			console.warn(
				`Task with ID ${newTaskId} does not exist in the current task list.`,
			);
		}
	};

	if (!currentTask) {
		if (tasks.data.length > 0) {
			// If the current task is not found, redirect to the first task in the list
			return redirect(`${user?.basePath}/zen/${tasks.data[0]!.id}`);
		}

		if (!currentTask) return <ZenModeNotFound />;
	}

	return (
		<ZenModeContext.Provider
			value={{
				tasks: tasks.data,
				currentTask,
				setCurrentTask: handleSetCurrentTask,
				next: handleNext,
				updateTask,
				contentRef,
				editorRef,
			}}
		>
			{children}
		</ZenModeContext.Provider>
	);
};

export const useZenMode = () => {
	const context = useContext(ZenModeContext);
	if (!context) {
		throw new Error("useZenMode must be used within a ZenModeProvider");
	}
	return context;
};
