import { DataSelectInput } from "@mimir/ui/data-select-input";
import { FormControl, FormField, FormItem } from "@mimir/ui/form";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { ChevronDown, GithubIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { trpc } from "@/utils/trpc";
import type { TaskFormValues } from "./form-type";

export const RepositorySelect = () => {
	const form = useFormContext<TaskFormValues>();

	const { data: repositories } = useQuery(
		trpc.github.getConnectedRepositories.queryOptions(
			{},
			{
				placeholderData: (data) => data,
			},
		),
	);
	const branchName = form.watch("branchName");

	return (
		<FormField
			name="repositoryName"
			control={form.control}
			render={({ field }) => (
				<FormItem>
					<FormControl>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant={"secondary"}
									className="flex h-6 items-center justify-between gap-4 rounded-sm px-2 text-xs"
								>
									<div className="flex items-center gap-2">
										<GithubIcon className="size-3.5 text-muted-foreground" />
										{field.value ? (
											<span>
												{field.value}
												{branchName ? `/${branchName}` : ""}
											</span>
										) : (
											<span className="text-muted-foreground">
												No repository assigned
											</span>
										)}
									</div>
									<ChevronDown className="size-3.5 text-muted-foreground" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuGroup>
									{repositories?.map((repo) => (
										<DropdownMenuSub key={repo.repositoryName}>
											<DropdownMenuSubTrigger>
												{repo.repositoryName}
											</DropdownMenuSubTrigger>
											<DropdownMenuSubContent>
												{repo.branches?.map((branch) => (
													<DropdownMenuItem
														key={branch}
														onSelect={() => {
															field.onChange(repo.repositoryName);
															form.setValue("branchName", branch);
															form.trigger("branchName");
														}}
													>
														{branch}
													</DropdownMenuItem>
												))}
											</DropdownMenuSubContent>
										</DropdownMenuSub>
									))}
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
						{/* <DataSelectInput
							size="sm"
							className="h-6! text-xs"
							queryOptions={trpc.github.getConnectedRepositories.queryOptions(
								{},
								{
									select: (data) => data,
								},
							)}
							before={<GithubIcon className="size-3.5" />}
							placeholder="Assign repository"
							value={field.value || null}
							onChange={(value) => field.onChange(value || undefined)}
							getLabel={(item) => item?.repositoryName ?? ""}
							getValue={(item) => item?.repositoryName ?? ""}
							renderValue={(item) => (
								<span className="flex items-center gap-2">
									{item.repositoryName}
								</span>
							)}
							renderItem={(item) => (
								<span className="flex items-center gap-2">
									{item.repositoryName}
								</span>
							)}
							variant={"secondary"}
						/> */}
					</FormControl>
				</FormItem>
			)}
		/>
	);
};
