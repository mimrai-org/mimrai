import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { getSession } from "@/lib/get-session";
import { queryClient, trpc } from "@/utils/trpc";
import { TeamInvite } from "./accept-invite";

type Props = {
	params: Promise<{
		inviteId: string;
	}>;
};

export default async function Page({ params }: Props) {
	const { inviteId } = await params;

	const session = await getSession();

	if (!session?.user) {
		return redirect(`/sign-up?callbackUrl=/invites/${inviteId}`);
	}

	const invite = await queryClient.fetchQuery(
		trpc.teams.getInviteById.queryOptions({
			inviteId: inviteId,
		}),
	);

	if (!invite) return notFound();

	return <TeamInvite invite={invite} />;
}
