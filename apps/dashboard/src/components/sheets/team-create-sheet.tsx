"use client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@mimir/ui/sheet";
import { useTeamParams } from "@/hooks/use-team-params";
import { TeamForm } from "../forms/team-form";

export const TeamCreateSheet = () => {
	const { createTeam, setParams } = useTeamParams();

	const isOpen = Boolean(createTeam);

	return (
		<Sheet open={isOpen} onOpenChange={() => setParams({ createTeam: false })}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Create a new team</SheetTitle>
				</SheetHeader>

				<div className="max-h-[95vh] overflow-y-auto">
					<TeamForm />
				</div>
			</SheetContent>
		</Sheet>
	);
};
