"use client";
import { useLocaleStore } from "@mimir/locale";
import { Avatar, AvatarFallback } from "@mimir/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@mimir/ui/dropdown-menu";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useChatParams } from "@/hooks/use-chat-params";
import { useTeamParams } from "@/hooks/use-team-params";
import { useUser } from "@/hooks/use-user";
import { trpc } from "@/utils/trpc";

export const TeamSwitcher = () => {
	const user = useUser();
	const { setParams } = useTeamParams();
	const { setParams: setChatParams } = useChatParams();
	const { data: teams } = useQuery(trpc.teams.getAvailable.queryOptions());
	const { setLocale } = useLocaleStore();

	const { mutateAsync: switchTeamAsync } = useMutation(
		trpc.users.switchTeam.mutationOptions(),
	);

	useEffect(() => {
		if (user?.team) {
			setLocale({
				locale: user.team.locale,
				timezone: user.team.timezone,
			});
		}
	}, [user?.team]);

	const switchTeam = async (teamId: string) => {
		const newUser = await switchTeamAsync({ teamId });
		setChatParams(null);
		window.location.reload();
		// queryClient.setQueryData(trpc.users.getCurrent.queryKey(), newUser);
		// queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="flex w-full items-center justify-between gap-2 py-2 opacity-90 hover:bg-transparent hover:opacity-100 focus:outline-none dark:hover:bg-transparent"
				>
					<div className="flex gap-2">
						<div className="flex aspect-square size-8 items-center justify-center rounded-lg border border-primary bg-primary text-sidebar-primary-foreground">
							<Avatar className="size-6 bg-transparent text-base">
								<AvatarFallback className="bg-transparent text-primary-foreground">
									{user?.team?.name?.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
						</div>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">{user?.team?.name}</span>
							<span className="truncate text-muted-foreground text-xs capitalize">
								{user?.team?.role}
							</span>
						</div>
					</div>

					<div>
						<ChevronsUpDownIcon className="size-4" />
					</div>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-62"
				side="right"
				align="start"
				sideOffset={10}
			>
				{teams?.map((team) => (
					<DropdownMenuItem key={team.id} onClick={() => switchTeam(team.id)}>
						<Avatar className="size-6">
							<AvatarFallback className="bg-primary text-primary-foreground">
								{team.name.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						{team.name}
					</DropdownMenuItem>
				))}
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => setParams({ createTeam: true })}>
					<PlusIcon className="size-4" />
					Create Team
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
