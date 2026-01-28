"use client";

import { useQuery } from "@tanstack/react-query";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@ui/components/ui/sidebar";
import Link from "next/link";
import { trpc } from "@/utils/trpc";
import { ProjectIcon } from "../project-icon";
import { useUser } from "../user-provider";

export function SidebarProjects() {
	const user = useUser();
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
							<SidebarMenuButton asChild>
								<Link href={`${user.basePath}/projects/${project.id}`}>
									<ProjectIcon {...project} />
									<span>{project.name}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
