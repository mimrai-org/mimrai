"use client";
import { Button } from "@mimir/ui/button";
import {
	Command,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@mimir/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@mimir/ui/popover";
import { useMutation, useQuery } from "@tanstack/react-query";
import { EyeIcon, EyeOffIcon, PlusIcon } from "lucide-react";
import { AssigneeAvatar } from "@/components/asignee-avatar";
import { useUser } from "@/hooks/use-user";
import { queryClient, trpc } from "@/utils/trpc";

export const SubscribersList = ({ taskId }: { taskId: string }) => {
	const user = useUser();
	const { data: subscribers } = useQuery(
		trpc.tasks.getSubscribers.queryOptions({
			id: taskId,
		}),
	);

	const { data: members } = useQuery(trpc.teams.getMembers.queryOptions());

	const { mutate: unsubscribe } = useMutation(
		trpc.tasks.unsubscribe.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.tasks.getSubscribers.queryOptions({ id: taskId }),
				);
			},
		}),
	);

	const { mutate: subscribe } = useMutation(
		trpc.tasks.subscribe.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.tasks.getSubscribers.queryOptions({ id: taskId }),
				);
			},
		}),
	);

	const isSubscribed = subscribers?.some(
		(subscriber) => subscriber.id === user?.id,
	);

	return (
		<div className="flex items-center gap-2">
			{isSubscribed ? (
				<Button
					variant={"ghost"}
					className="w-fit justify-start text-start text-xs"
					type="button"
					size={"sm"}
					onClick={() => {
						unsubscribe({ id: taskId });
					}}
				>
					<EyeOffIcon className="text-destructive" />
					Unsubscribe
				</Button>
			) : (
				<Button
					variant={"ghost"}
					className="w-fit justify-start text-start text-xs"
					type="button"
					size={"sm"}
					onClick={() => {
						subscribe({ id: taskId, userId: user?.id! });
					}}
				>
					<EyeIcon />
					Subscribe
				</Button>
			)}
			<Popover>
				<PopoverTrigger asChild>
					<Button variant={"ghost"} size={"sm"} className="font-mono">
						<EyeIcon />
						{subscribers?.length ?? 0}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="p-0">
					<div className="">
						<div className="border-b py-2">
							{subscribers?.map((subscriber) => (
								<div
									key={subscriber.id}
									className="flex items-center px-4 py-2"
								>
									<AssigneeAvatar {...subscriber} />
									<span className="ml-2 text-sm">{subscriber.name}</span>
								</div>
							))}
						</div>
						<div className="p-2">
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant={"ghost"}
										className="w-full justify-start text-start"
										onClick={() => {
											subscribe({ id: taskId, userId: "current" });
										}}
									>
										<PlusIcon />
										Add people
									</Button>
								</PopoverTrigger>
								<PopoverContent>
									<Command>
										<CommandInput placeholder="Search members..." />
										<CommandGroup>
											{members?.map((member) => (
												<CommandItem
													key={member.id}
													onSelect={() => {
														subscribe({ id: taskId, userId: member.id });
													}}
												>
													<AssigneeAvatar {...member} />
													{member.name}
												</CommandItem>
											))}
										</CommandGroup>
									</Command>
								</PopoverContent>
							</Popover>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
};
