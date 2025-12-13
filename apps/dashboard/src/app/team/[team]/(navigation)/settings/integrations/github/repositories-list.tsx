"use client";
import type { RouterOutputs } from "@api/trpc/routers";
import { Button } from "@mimir/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@mimir/ui/card";
import { Checkbox } from "@mimir/ui/checkbox";
import {
	Command,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@mimir/ui/command";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@mimir/ui/dropdown-menu";
import { Input } from "@mimir/ui/input";
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
	PopoverTrigger,
} from "@mimir/ui/popover";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@ui/components/ui/alert";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/ui/dialog";
import { Textarea } from "@ui/components/ui/textarea";
import { format } from "date-fns";
import { EllipsisIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { queryClient, trpc } from "@/utils/trpc";

export const RepositoriesList = ({
	integrationId,
}: {
	integrationId: string;
}) => {
	const { data: connectedRepos } = useQuery(
		trpc.github.getConnectedRepositories.queryOptions({}),
	);

	const { mutate: disconnectRepo } = useMutation(
		trpc.github.disconnectRepository.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.github.getConnectedRepositories.queryOptions(),
				);
			},
		}),
	);

	const gridClass = "grid grid-cols-4 gap-4 items-center";

	return (
		<Card>
			<CardHeader>
				<CardTitle>Connected Repositories</CardTitle>
				<CardDescription>
					<ConnectRepositoryInput integrationId={integrationId} />
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ul className="text-sm">
					<li
						className={cn(
							gridClass,
							"font-medium text-muted-foreground text-xs",
						)}
					>
						<span>Repository</span>
						<span className="flex justify-end px-4">Branches</span>
						<span className="flex justify-end">Connected At</span>
						<span />
					</li>
					{connectedRepos?.map((repo) => (
						<li className={`py-2 ${gridClass}`} key={repo.repositoryId}>
							{repo.repositoryName}

							<BranchesInput repository={repo} />
							<span className="flex justify-end">
								{format(new Date(repo.createdAt ?? ""), "PPpp")}
							</span>
							<span className="flex justify-end">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="icon">
											<EllipsisIcon />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<DropdownMenuItem
											variant="destructive"
											onClick={() =>
												disconnectRepo({ repositoryId: repo.repositoryId })
											}
										>
											Disconnect
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</span>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
};

export const ConnectRepositoryInput = ({
	integrationId,
}: {
	integrationId: string;
}) => {
	const { data } = useQuery(trpc.github.getRemoteRepositories.queryOptions({}));
	const [showPopover, setShowPopover] = useState(false);
	const [search, setSearch] = useState("");

	const filteredData = data?.filter((repo) =>
		repo.full_name.toLowerCase().includes(search.toLowerCase()),
	);

	const { mutate } = useMutation(
		trpc.github.connectRepository.mutationOptions({
			onSuccess: () => {
				setShowPopover(false);
				setSearch("");
				queryClient.invalidateQueries(
					trpc.github.getConnectedRepositories.queryOptions(),
				);
			},
		}),
	);

	const handleSelect = (
		repo: RouterOutputs["github"]["getRemoteRepositories"][number],
	) => {
		mutate({
			repositoryId: repo.id,
			repositoryName: repo.full_name,
			integrationId,
		});
	};

	return (
		<div className="mt-4 w-72">
			<Popover open={showPopover} onOpenChange={setShowPopover}>
				<PopoverAnchor>
					<Input
						placeholder="Connect a repository..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onClick={() => setShowPopover(true)}
					/>
				</PopoverAnchor>
				<PopoverContent
					align="start"
					onOpenAutoFocus={(e) => e.preventDefault()}
				>
					<Command>
						<CommandGroup>
							{filteredData?.map((repo) => (
								<CommandItem
									key={repo.id}
									onSelect={handleSelect.bind(null, repo)}
									autoFocus={false}
								>
									{repo.full_name}
								</CommandItem>
							))}
						</CommandGroup>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
};

export const BranchesInput = ({
	repository,
}: {
	repository: RouterOutputs["github"]["getConnectedRepositories"][number];
}) => {
	const { data: branches } = useQuery(
		trpc.github.getRemoteRepositoryBranches.queryOptions({
			repositoryId: repository.repositoryId,
		}),
	);

	const { mutate: updateRepository } = useMutation(
		trpc.github.updateConnectedRepository.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.github.getConnectedRepositories.queryOptions(),
				);
			},
		}),
	);

	const handleSelectBranch = (branchName: string) => {
		const newBranches = repository.branches ? [...repository.branches] : [];
		if (!newBranches.includes(branchName)) {
			newBranches.push(branchName);
			updateRepository({ id: repository.id, branches: newBranches });
		} else {
			const index = newBranches.indexOf(branchName);
			if (index > -1) {
				newBranches.splice(index, 1);
				updateRepository({ id: repository.id, branches: newBranches });
			}
		}
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant={"ghost"} className="flex justify-end" size="sm">
					<span className="font-normal text-muted-foreground text-sm">
						Add branches...
					</span>
					{repository.branches?.map((branch) => (
						<span key={branch} className="border px-2 py-0.5 text-sm">
							{branch}
						</span>
					))}
				</Button>
			</PopoverTrigger>
			<PopoverContent>
				<Command>
					<CommandInput />
					<CommandGroup>
						{branches?.map((branch) => (
							<CommandItem
								key={branch.name}
								onSelect={handleSelectBranch.bind(null, branch.name)}
							>
								<Checkbox
									checked={repository.branches?.includes(branch.name)}
									className="mr-2"
								/>
								{branch.name}
							</CommandItem>
						))}
					</CommandGroup>
				</Command>
			</PopoverContent>
		</Popover>
	);
};
