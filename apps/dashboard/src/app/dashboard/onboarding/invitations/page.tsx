import { Button } from "@mimir/ui/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/get-session";
import { InvitationsList } from "./invitations-list";

export default async function Page() {
	const session = await getSession();

	return (
		<div className="mx-auto flex h-screen w-1/3 flex-col justify-center gap-4">
			<div className="space-y-1">
				<h1 className="text-4xl">You have some pending invitations!</h1>
				<p>Check below for teams you have been invited to</p>
			</div>
			<InvitationsList email={session?.user?.email} />
			<div className="flex justify-start">
				<Link href={"/dashboard/onboarding"}>
					<Button type="button">
						Continue
						<ChevronRight />
					</Button>
				</Link>
			</div>
		</div>
	);
}
