import { MemberInvite } from "./member-invite";
import { MembersList } from "./members-list";

export default function Page() {
	return (
		<div className="space-y-6">
			<MemberInvite />
			<MembersList />
		</div>
	);
}
