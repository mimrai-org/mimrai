import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import {
	ArchiveIcon,
	EllipsisIcon,
	MailMinusIcon,
	SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/components/user-provider";
import { queryClient, trpc } from "@/utils/trpc";
import type { Inbox } from "./use-inbox";

export const InboxDropdown = ({
	className,
	children,
	inbox,
}: {
	className?: string;
	children?: React.ReactNode;
	inbox: Inbox;
}) => {
	const { mutate: update, isPending } = useMutation(
		trpc.inbox.update.mutationOptions({
			onSettled: () => {
				queryClient.invalidateQueries(trpc.inbox.get.infiniteQueryOptions({}));
			},
		}),
	);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="size-6">
					<EllipsisIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<GmailItems inbox={inbox} />
				<DropdownMenuItem
					disabled={isPending}
					onSelect={() => {
						update({
							id: inbox.id,
							status: "archived",
						});
					}}
				>
					<ArchiveIcon />
					Archive
				</DropdownMenuItem>
				{children}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export const GmailItems = ({ inbox }: { inbox: Inbox }) => {
	const user = useUser();
	const { data } = useQuery(
		trpc.integrations.getByType.queryOptions({ type: "gmail" }),
	);
	const { mutate: updateConfig } = useMutation(
		trpc.integrations.updateLinkedUser.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.integrations.getByType.queryOptions({ type: "gmail" }),
				);
			},
		}),
	);
	const config = data?.installedUserIntegration?.config ?? {};
	const sendersBlacklist: string[] = config?.filters?.sendersBlacklist || [];
	const emailFrom = inbox.metadata?.from?.match(/<(.+)>/)[1];
	const isIgnored = emailFrom && sendersBlacklist.includes(emailFrom);

	const ignoreSender = () => {
		if (!data) return;
		if (!config) return;
		if (!emailFrom) return;

		if (!sendersBlacklist.includes(emailFrom)) {
			sendersBlacklist.push(emailFrom);
		}

		updateConfig({
			integrationType: "gmail",
			config: {
				filters: {
					...config.filters,
					sendersBlacklist,
				},
			},
		});
	};

	if (!data) {
		return null;
	}

	if (inbox.source !== "gmail") {
		return null;
	}

	return (
		<>
			{isIgnored ? null : (
				<DropdownMenuItem onSelect={() => ignoreSender()}>
					<MailMinusIcon />
					Ignore this sender
				</DropdownMenuItem>
			)}
			<Link href={`${user?.basePath}/settings/integrations/gmail`}>
				<DropdownMenuItem>
					<SettingsIcon />
					Configure Gmail
				</DropdownMenuItem>
			</Link>
			<DropdownMenuSeparator />
		</>
	);
};
