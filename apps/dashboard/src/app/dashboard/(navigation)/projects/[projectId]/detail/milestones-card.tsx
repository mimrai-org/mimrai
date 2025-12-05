"use client";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { Card, CardContent } from "@ui/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { format } from "date-fns";
import {
	Ellipsis,
	ExternalLinkIcon,
	PencilIcon,
	PlusIcon,
	TrashIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useMemo } from "react";
import { MilestoneForm } from "@/components/forms/milestone-form";
import { MilestoneIcon } from "@/components/milestone-icon";
import { useMilestoneParams } from "@/hooks/use-milestone-params";
import { queryClient, trpc } from "@/utils/trpc";

export const MilestonesCard = ({ projectId }: { projectId: string }) => {
	const { setParams, createMilestone, milestoneId } = useMilestoneParams();
	const { data } = useInfiniteQuery(
		trpc.milestones.get.infiniteQueryOptions(
			{
				pageSize: 5,
				projectId: projectId,
			},
			{
				getNextPageParam: (lastPage) => lastPage.meta?.cursor,
			},
		),
	);

	const milestones = useMemo(() => {
		return data?.pages.flatMap((page) => page.data) || [];
	}, [data]);

	return (
		<Card>
			<CardContent>
				<div className="flex items-center justify-between">
					<h3 className="text-sm">Milestones</h3>
					<Button
						variant={"ghost"}
						size={"sm"}
						onClick={() =>
							setParams({
								createMilestone: true,
								milestoneProjectId: projectId,
							})
						}
					>
						<PlusIcon />
					</Button>
				</div>

				<ul className="mt-4 space-y-2">
					<AnimatePresence mode="popLayout">
						{milestones.map((milestone) => {
							const total =
								milestone.progress.completed + milestone.progress.inProgress;
							const percentage = total
								? Math.round((milestone.progress.completed / total) * 100)
								: 0;
							return (
								<motion.li
									key={milestone.id}
									variants={{
										initial: { opacity: 0, height: 0 },
										animate: { opacity: 1, height: "auto" },
										hover: {
											opacity: 1,
										},
									}}
									initial={"initial"}
									animate={"animate"}
									exit={"initial"}
									whileHover={"hover"}
									transition={{ duration: 0.2 }}
								>
									{milestoneId === milestone.id ? (
										<MilestoneForm
											projectId={projectId}
											defaultValues={milestone}
										/>
									) : (
										<div className="flex items-center justify-between text-sm">
											<div className="flex items-center gap-1">
												<MilestoneIcon
													color={milestone.color}
													className="size-4"
												/>
												<span className="px-3">{milestone.name}</span>
												<span className="text-muted-foreground text-xs">
													{percentage}% of {total}
												</span>
											</div>
											<div className="flex items-center gap-2 text-xs">
												<Link href={`./tasks?mId=${milestone.id}`}>
													<motion.button
														type="button"
														variants={{
															hover: {
																opacity: 1,
															},
															initial: {
																opacity: 0,
															},
														}}
														className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
													>
														<ExternalLinkIcon className="size-3.5" />
														See Tasks
													</motion.button>
												</Link>
												{milestone.dueDate && (
													<span className="text-muted-foreground">
														{format(new Date(milestone.dueDate), "MMM dd")}
													</span>
												)}
												<MilestoneDropdownMenu milestoneId={milestone.id} />
											</div>
										</div>
									)}
								</motion.li>
							);
						})}
						{createMilestone && (
							<motion.li
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: "auto" }}
								exit={{ opacity: 0, height: 0 }}
								transition={{ duration: 0.2 }}
							>
								<MilestoneForm projectId={projectId} />
							</motion.li>
						)}
					</AnimatePresence>
				</ul>
			</CardContent>
		</Card>
	);
};

export const MilestoneDropdownMenu = ({
	milestoneId,
}: {
	milestoneId: string;
}) => {
	const { setParams } = useMilestoneParams();

	const { mutate: deleteMilestone } = useMutation(
		trpc.milestones.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.milestones.get.infiniteQueryOptions(),
				);
			},
		}),
	);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm">
					<Ellipsis />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem
					onSelect={() => {
						setParams({ milestoneId });
					}}
				>
					<PencilIcon />
					Edit
				</DropdownMenuItem>
				<DropdownMenuItem
					variant="destructive"
					onSelect={() => {
						deleteMilestone({
							id: milestoneId,
						});
					}}
				>
					<TrashIcon />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
