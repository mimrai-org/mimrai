"use client";

import { useMutation } from "@tanstack/react-query";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@ui/components/ui/context-menu";
import { CopyPlusIcon, EditIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import { useProjectParams } from "@/hooks/use-project-params";
import { queryClient, trpc } from "@/utils/trpc";
import type { Project } from "./list";

export const ProjectContextMenu = ({
	project,
	children,
}: {
	project: Project;
	children: React.ReactNode;
}) => {
	const { setParams } = useProjectParams();

	const { mutate: deleteProject, isPending: isDeleting } = useMutation(
		trpc.projects.delete.mutationOptions({
			onMutate: () => {
				toast.loading("Deleting project...", { id: "delete-project" });
			},
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.projects.get.infiniteQueryOptions());
				toast.success("Project deleted successfully", { id: "delete-project" });
			},
			onError: (_error) => {
				toast.error("Failed to delete project", { id: "delete-project" });
			},
		}),
	);

	const { mutate: cloneProject } = useMutation(
		trpc.projects.clone.mutationOptions({
			onMutate: () => {
				toast.loading("Cloning project...", { id: "clone-project" });
			},
			onSuccess: (project) => {
				queryClient.invalidateQueries(trpc.projects.get.infiniteQueryOptions());
				toast.success("Project cloned successfully", { id: "clone-project" });
				setParams({ projectId: project.id });
			},
			onError: (_error) => {
				toast.error("Failed to clone project", { id: "clone-project" });
			},
		}),
	);

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem
					onClick={() => {
						setParams({
							projectId: project.id,
						});
					}}
				>
					<EditIcon />
					Edit
				</ContextMenuItem>
				<ContextMenuItem
					onClick={() => {
						cloneProject({ id: project.id });
					}}
				>
					<CopyPlusIcon />
					Clone
				</ContextMenuItem>
				<ContextMenuItem
					variant="destructive"
					disabled={isDeleting}
					onClick={() => {
						deleteProject({ id: project.id });
					}}
				>
					<TrashIcon />
					Delete
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};
