import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";
import { TeamInvite } from "./accept-invite";

type Props = {
	params: Promise<{
		inviteId: string;
	}>;
};

export default async function Page({ params }: Props) {
	const { inviteId } = await params;

	const { data: session } = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
		},
	});

	if (!session?.user) {
		return redirect(`/sign-in?callbackUrl=/invites/${inviteId}`);
	}

	const invite = await queryClient.fetchQuery(
		trpc.teams.getInviteById.queryOptions({
			inviteId: inviteId,
		}),
	);

	if (!invite) return notFound();

	return <TeamInvite invite={invite} />;
}
