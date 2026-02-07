"use client";

import { useQuery } from "@tanstack/react-query";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@ui/components/ui/sidebar";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@ui/components/ui/tooltip";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useProjectParams } from "@/hooks/use-project-params";
import { trpc } from "@/utils/trpc";
import { ProjectIcon } from "../project-icon";
import { useUser } from "../user-provider";

export function SidebarProjects() {
	const user = useUser();
	const { open } = useSidebar();
	const { setParams: setProjectParams } = useProjectParams();
	const { data: projects } = useQuery(
		trpc.projects.get.queryOptions({
			pageSize: 10,
		}),
	);

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Projects</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{projects?.data.map((project) => (
						<SidebarMenuItem key={project.id}>
							<Tooltip>
								<TooltipTrigger asChild>
									<SidebarMenuButton asChild>
										<Link href={`${user.basePath}/projects/${project.id}`}>
											<ProjectIcon {...project} />
											<span>{project.name}</span>
										</Link>
									</SidebarMenuButton>
								</TooltipTrigger>
								{!open && (
									<TooltipContent side="right">{project.name}</TooltipContent>
								)}
							</Tooltip>
						</SidebarMenuItem>
					))}

					<SidebarMenuItem>
						<Tooltip>
							<TooltipTrigger asChild>
								<SidebarMenuButton
									onClick={() => {
										setProjectParams({
											createProject: true,
										});
									}}
								>
									<PlusIcon />
									<span>New Project</span>
								</SidebarMenuButton>
							</TooltipTrigger>
							<TooltipContent side="right">Create New Project</TooltipContent>
						</Tooltip>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
