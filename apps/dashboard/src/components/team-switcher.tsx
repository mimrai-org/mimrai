"use client";
import { useLocaleStore } from "@mimir/locale";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useChatParams } from "@/hooks/use-chat-params";
import { useTeamParams } from "@/hooks/use-team-params";
import { useUser } from "@/hooks/use-user";
import { trpc } from "@/utils/trpc";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

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
					className="flex cursor-pointer items-center gap-2"
				>
					<Avatar className="size-6 text-xs">
						<AvatarFallback className="bg-primary text-primary-foreground">
							{user?.team?.name?.charAt(0).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div className="flex items-center justify-between gap-1">
						<div className="text-sm">{user?.team?.name}</div>
						<ChevronsUpDownIcon className="size-3.5" />
					</div>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-48"
				side="bottom"
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
