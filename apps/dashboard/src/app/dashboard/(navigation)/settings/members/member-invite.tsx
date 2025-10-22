"use client";
import { t } from "@mimir/locale";
import { MemberInviteForm } from "@/components/forms/member-invite-form";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@/components/ui/card";
import { useScopes } from "@/hooks/use-user";

export const MemberInvite = () => {
	const canWriteTeam = useScopes(["team:write"]);

	if (!canWriteTeam) return null;

	return (
		<Card>
			<CardHeader>
				<CardDescription>
					{t("settings.members.invite.description")}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<MemberInviteForm />
			</CardContent>
		</Card>
	);
};
