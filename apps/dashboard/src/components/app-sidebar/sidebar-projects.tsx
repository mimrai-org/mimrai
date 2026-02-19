"use client";

import { useQuery } from "@tanstack/react-query";
import {
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@ui/components/ui/sidebar";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProjectParams } from "@/hooks/use-project-params";
import { trpc } from "@/utils/trpc";
import { ProjectIcon } from "../project-icon";
import { ProjectContextMenu } from "../projects/context-menu";
import { useUser } from "../user-provider";

export function SidebarProjects() {
	const user = useUser();
	const pathname = usePathname();
	const { open } = useSidebar();
	const { setParams: setProjectParams } = useProjectParams();
	const { data: projects } = useQuery(
		trpc.projects.get.queryOptions({
			pageSize: 10,
		}),
	);

	return (
		<SidebarGroup>
			<Link href={`${user.basePath}/projects`}>
				<SidebarGroupLabel>Projects</SidebarGroupLabel>
			</Link>
			<SidebarGroupAction
				onClick={() => {
					setProjectParams({
						createProject: true,
					});
				}}
			>
				<PlusIcon />
			</SidebarGroupAction>
			<SidebarGroupContent>
				<SidebarMenu>
					{projects?.data.map((project) => {
						const isActive = pathname.startsWith(
							`${user.basePath}/projects/${project.id}`,
						);
						return (
							<ProjectContextMenu key={project.id} project={project}>
								<SidebarMenuItem>
									<SidebarMenuButton
										asChild
										tooltip={project.name}
										isActive={isActive}
									>
										<Link href={`${user.basePath}/projects/${project.id}`}>
											<ProjectIcon {...project} />
											<span>{project.name}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</ProjectContextMenu>
						);
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
