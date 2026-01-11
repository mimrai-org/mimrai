import { useQuery } from "@tanstack/react-query";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { UserStarIcon } from "lucide-react";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { AssigneeAvatar } from "@/components/asignee-avatar";
import { trpc } from "@/utils/trpc";
import type { ProjectFormValues } from "./form-type";

export const ProjectLeadSelect = () => {
	const form = useFormContext<ProjectFormValues>();

	const leadId = form.watch("leadId");
	const { data: teamMembers } = useQuery(trpc.teams.getMembers.queryOptions());

	const lead = useMemo(() => {
		if (!teamMembers || !leadId) return null;
		return teamMembers.find((member) => member.id === leadId) || null;
	}, [leadId, teamMembers]);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="flex h-7 items-center gap-2 rounded-sm border px-2 text-xs">
				<UserStarIcon className="size-3.5 text-muted-foreground" />
				{lead ? (
					<div className="flex gap-2">
						<AssigneeAvatar key={lead.id} {...lead} className="size-4" />
						{lead.name}
					</div>
				) : (
					<span>Lead</span>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				{teamMembers?.map((member) => (
					<DropdownMenuItem
						key={member.id}
						className="flex items-center gap-2"
						onSelect={() => {
							form.setValue("leadId", member.id);
						}}
					>
						<AssigneeAvatar {...member} className="size-5" />
						<span className="flex-1">{member.name}</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
