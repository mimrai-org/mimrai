"use client";
import { t } from "@mimir/locale";
import { Card, CardContent, CardDescription, CardHeader } from "@mimir/ui/card";
import { MemberInviteForm } from "@/components/forms/member-invite-form";
import { useScopes } from "@/hooks/use-scopes";

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
