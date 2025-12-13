import { Suspense } from "react";
import { MemberInvite } from "./member-invite";
import { MembersInvitesList } from "./members-invites-list";
import { MembersList } from "./members-list";

export default function Page() {
	return (
		<div className="space-y-6">
			<MemberInvite />
			<Suspense>
				<MembersList />
			</Suspense>
			<MembersInvitesList />
		</div>
	);
}
