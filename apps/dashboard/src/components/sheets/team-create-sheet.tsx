"use client";
import { useTeamParams } from "@/hooks/use-team-params";
import { TeamForm } from "../forms/team-form";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";

export const TeamCreateSheet = () => {
	const { createTeam, setParams } = useTeamParams();

	const isOpen = Boolean(createTeam);

	return (
		<Sheet open={isOpen} onOpenChange={() => setParams({ createTeam: false })}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Create a new team</SheetTitle>
				</SheetHeader>

				<TeamForm />
			</SheetContent>
		</Sheet>
	);
};
