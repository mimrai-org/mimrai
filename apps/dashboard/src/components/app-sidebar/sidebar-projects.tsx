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
import Link from "next/link";
import { trpc } from "@/utils/trpc";
import { ProjectIcon } from "../project-icon";
import { useUser } from "../user-provider";

export function SidebarProjects() {
	const user = useUser();
	const { open } = useSidebar();
	const { data: projects } = useQuery(
		trpc.projects.get.queryOptions({
			pageSize: 5,
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
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
