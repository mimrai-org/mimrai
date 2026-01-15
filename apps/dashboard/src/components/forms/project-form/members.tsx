import { useQuery } from "@tanstack/react-query";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { FormLabel } from "@ui/components/ui/form";
import { UsersIcon } from "lucide-react";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { AssigneeAvatar } from "@/components/asignee-avatar";
import { trpc } from "@/utils/trpc";
import type { PropertiesLayout } from "./form";
import type { ProjectFormValues } from "./form-type";

export const ProjectMembersSelect = ({
	variant,
}: {
	variant?: PropertiesLayout;
}) => {
	const form = useFormContext<ProjectFormValues>();

	const leadId = form.watch("leadId");
	const memberIds = form.watch("memberIds") || [];
	const { data: teamMembers } = useQuery(trpc.teams.getMembers.queryOptions());

	const members = useMemo(() => {
		if (!teamMembers) return [];
		return teamMembers.filter(
			(member) => memberIds.includes(member.id) && member.id !== leadId,
		);
	}, [memberIds, teamMembers, leadId]);

	const teamMembersFiltered = useMemo(() => {
		if (!teamMembers) return [];
		return teamMembers
			.filter((member) => member.id !== leadId)
			.sort((a, b) => {
				// Members already selected appear first
				const aSelected = memberIds.includes(a.id) ? 0 : 1;
				const bSelected = memberIds.includes(b.id) ? 0 : 1;
				if (aSelected !== bSelected) {
					return aSelected - bSelected;
				}
				// Then sort alphabetically
				return a.name.localeCompare(b.name);
			});
	}, [teamMembers, leadId, memberIds]);

	return (
		<div className="space-y-1">
			{variant !== "compact" && <FormLabel>Members</FormLabel>}
			<DropdownMenu>
				<DropdownMenuTrigger className="flex h-6 items-center gap-2 text-sm">
					<UsersIcon className="size-3.5 text-muted-foreground" />
					{members.length > 0 ? (
						<div className="-space-x-2 flex">
							{members.map((member) => (
								<AssigneeAvatar
									key={member.id}
									{...member}
									className="size-4"
								/>
							))}
						</div>
					) : (
						<span className="text-muted-foreground">Members</span>
					)}
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					{teamMembersFiltered?.map((member) => (
						<DropdownMenuCheckboxItem
							key={member.id}
							className="flex items-center gap-2"
							checked={memberIds.includes(member.id)}
							onCheckedChange={(checked) => {
								const newMemberIds = checked
									? [...memberIds, member.id]
									: memberIds.filter((id) => id !== member.id);
								form.setValue("memberIds", newMemberIds);
							}}
						>
							<AssigneeAvatar {...member} className="size-5" />
							<span className="flex-1">{member.name}</span>
						</DropdownMenuCheckboxItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};
