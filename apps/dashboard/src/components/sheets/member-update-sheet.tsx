"use client";
import { useQuery } from "@tanstack/react-query";
import { useMemberParams } from "@/hooks/use-member-params";
import { trpc } from "@/utils/trpc";
import { MemberUpdateForm } from "../forms/member-update-form";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";

export const MemberUpdateSheet = () => {
	const { memberId, setParams } = useMemberParams();

	const isOpen = Boolean(memberId);

	const { data: member } = useQuery(
		trpc.teams.getMemberById.queryOptions(
			{ userId: memberId! },
			{
				enabled: isOpen,
			},
		),
	);

	return (
		<Sheet open={isOpen} onOpenChange={() => setParams(null)}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Update Member</SheetTitle>
				</SheetHeader>

				{member && (
					<MemberUpdateForm
						defaultValues={{
							userId: member?.id || "",
							description: member?.description || "",
						}}
					/>
				)}
			</SheetContent>
		</Sheet>
	);
};
