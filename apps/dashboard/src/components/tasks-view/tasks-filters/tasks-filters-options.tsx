import { getContrast } from "@mimir/utils/random";
import { TagsIcon, UserIcon } from "lucide-react";
import { AssigneeAvatar } from "@/components/kanban/asignee-avatar";
import { MilestoneIcon } from "@/components/milestone-icon";
import { ProjectIcon } from "@/components/project-icon";
import { trpc } from "@/utils/trpc";

export const tasksFilterOptions = {
	assignee: {
		label: "Assignee",
		multiple: true,
		icon: <UserIcon className="size-4!" />,
		filterKey: "assigneeId",
		queryOptions: trpc.teams.getMembers.queryOptions(
			{},
			{
				select: (members) =>
					members.map((member) => ({
						value: member.id,
						label: member.name,
						icon: <AssigneeAvatar {...member} className="size-4!" />,
						original: member,
					})),
			},
		),
	},
	project: {
		label: "Project",
		multiple: true,
		icon: <ProjectIcon className="size-4!" />,
		filterKey: "projectId",
		queryOptions: trpc.projects.get.queryOptions(
			{},
			{
				select: (projects) =>
					projects.data.map((project) => ({
						value: project.id,
						label: project.name,
						icon: <ProjectIcon {...project} className="size-4!" />,
						original: project,
					})),
			},
		),
	},
	milestone: {
		label: "Milestone",
		multiple: true,
		icon: <MilestoneIcon className="size-4!" />,
		filterKey: "milestoneId",
		queryOptions: trpc.milestones.get.queryOptions(
			{},
			{
				select: (milestones) =>
					milestones.data.map((milestone) => ({
						value: milestone.id,
						label: milestone.name,
						icon: <MilestoneIcon {...milestone} className="size-4!" />,
						original: milestone,
					})),
			},
		),
	},
	labels: {
		label: "Labels",
		multiple: true,
		icon: <TagsIcon className="size-4!" />,
		filterKey: "labels",
		queryOptions: trpc.labels.get.queryOptions(
			{},
			{
				select: (labels) =>
					labels.map((label) => ({
						value: label.id,
						label: label.name,
						icon: (
							<div className="flex size-4 items-center justify-center">
								<div
									className="size-2 rounded-full"
									style={{
										backgroundColor: label.color,
										color: getContrast(label.color),
									}}
								/>
							</div>
						),
						original: label,
					})),
			},
		),
	},
};
