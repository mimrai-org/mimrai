import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { SearchParams } from "nuqs";
import { authClient } from "@/lib/auth-client";
import { getSession } from "@/lib/get-session";
import { queryClient, trpc } from "@/utils/trpc";
import { TeamInvite } from "./accept-invite";

type Props = {
	params: Promise<{
		inviteId: string;
	}>;
	searchParams: SearchParams;
};

export default async function Page({ params, searchParams }: Props) {
	const { inviteId } = await params;
	const email = searchParams.email as string | undefined;

	const session = await getSession();

	if (!session?.user) {
		return redirect(`/sign-in?callbackUrl=/invites/${inviteId}&email=${email}`);
	}

	const invite = await queryClient.fetchQuery(
		trpc.teams.getInviteById.queryOptions({
			inviteId: inviteId,
		}),
	);
	if (!invite) return notFound();

	if (invite.email !== session.user.email) {
		return redirect("/dashboard");
	}

	return <TeamInvite invite={invite} />;
}
