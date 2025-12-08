"use client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import {
	CopyPlusIcon,
	EllipsisVerticalIcon,
	ShareIcon,
	TrashIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import Loader from "@/components/loader";
import { useProjectParams } from "@/hooks/use-project-params";
import { useShareableParams } from "@/hooks/use-shareable-params";
import { queryClient, trpc } from "@/utils/trpc";
import type { ProjectFormValues } from "./form-type";

export const ActionsMenu = () => {
	const router = useRouter();
	const { setParams } = useProjectParams();
	const { setParams: setShareableParams } = useShareableParams();
	const form = useFormContext<ProjectFormValues>();

	const { mutate: deleteProject, isPending: isDeleting } = useMutation(
		trpc.projects.delete.mutationOptions({
			onMutate: () => {
				toast.loading("Deleting project...", {
					id: "deleting-project",
				});
			},
			onSuccess: () => {
				toast.success("project deleted", {
					id: "deleting-project",
				});
				queryClient.invalidateQueries(trpc.projects.get.infiniteQueryOptions());
				queryClient.invalidateQueries(trpc.projects.get.queryOptions());
				setParams(null);
			},
			onError: () => {
				toast.error("Failed to delete project", {
					id: "deleting-project",
				});
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
				router.push(`/dashboard/projects/${project.id}`);
			},
			onError: (error) => {
				toast.error("Failed to clone project", { id: "clone-project" });
			},
		}),
	);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button type="button" variant={"ghost"} size={"icon"}>
					<EllipsisVerticalIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem
					onClick={() => {
						cloneProject({ id: form.getValues().id! });
					}}
				>
					<CopyPlusIcon />
					Clone
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => {
						setShareableParams({
							createShareable: true,
							shareableResourceId: form.getValues().id!,
							shareableResourceType: "project",
						});
					}}
				>
					<ShareIcon />
					Share
				</DropdownMenuItem>
				<DropdownMenuItem
					variant="destructive"
					disabled={isDeleting}
					onClick={() =>
						deleteProject({
							id: form.getValues().id!,
						})
					}
				>
					{isDeleting ? <Loader /> : <TrashIcon />}
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
