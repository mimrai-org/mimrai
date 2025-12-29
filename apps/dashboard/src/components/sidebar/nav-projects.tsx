import { useQuery } from "@tanstack/react-query";
import {
	CircularProgress,
	CircularProgressIndicator,
	CircularProgressRange,
	CircularProgressTrack,
} from "@ui/components/ui/circular-progress";
import {
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@ui/components/ui/sidebar";
import { BoxIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { trpc } from "@/utils/trpc";
import { ProjectIcon } from "../project-icon";

export const NavProjects = () => {
	const user = useUser();
	const pathname = usePathname();

	const { data: recentProjects } = useQuery(
		trpc.projects.get.queryOptions(
			{
				pageSize: 2,
			},
			{
				staleTime: 5 * 60 * 1000, // 5 minutes
			},
		),
	);

	const isActive = pathname === `${user?.basePath}/projects`;

	return (
		<SidebarMenuItem>
			<SidebarMenuButton asChild isActive={isActive}>
				<Link href={`${user?.basePath}/projects`}>
					<BoxIcon />
					Projects
				</Link>
			</SidebarMenuButton>
			{recentProjects?.data && recentProjects.data.length > 0 && (
				<SidebarMenuSub>
					{recentProjects?.data.map((project) => {
						const isActive = pathname?.startsWith(
							`${user?.basePath}/projects/${project.id}`,
						);

						const total =
							project.progress.inProgress + project.progress.completed;
						const progress =
							total > 0
								? Math.round((project.progress.completed / total) * 100)
								: 0;

						return (
							<SidebarMenuSubItem key={project.id}>
								<SidebarMenuSubButton
									isActive={isActive}
									className="flex w-full cursor-pointer items-center justify-between space-x-2"
									asChild
								>
									<Link
										href={`/team/${user?.team?.slug}/projects/${project.id}/detail`}
									>
										<div className="flex items-center space-x-2">
											<CircularProgress
												size={16}
												thickness={2}
												value={progress ?? 0}
												min={0}
												max={100}
											>
												<CircularProgressIndicator>
													<CircularProgressTrack />
													<CircularProgressRange
														style={{
															color: project.color || undefined,
														}}
													/>
												</CircularProgressIndicator>
											</CircularProgress>
											{/* <ProjectIcon {...project} className="size-4" /> */}
											<span className="truncate">{project.name}</span>
										</div>
									</Link>
								</SidebarMenuSubButton>
							</SidebarMenuSubItem>
						);
					})}
				</SidebarMenuSub>
			)}
		</SidebarMenuItem>
	);
};
