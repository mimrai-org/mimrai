import { MemberInviteForm } from "@/components/forms/member-invite-form";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@/components/ui/card";

export const MemberInvite = () => {
	return (
		<Card>
			<CardHeader>
				<CardDescription>Invite new members by email</CardDescription>
			</CardHeader>
			<CardContent>
				<MemberInviteForm />
			</CardContent>
		</Card>
	);
};
