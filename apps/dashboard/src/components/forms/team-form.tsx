"use client";
import { useMutation } from "@tanstack/react-query";
import z from "zod";
import { useScopes } from "@/hooks/use-user";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import { queryClient, trpc } from "@/utils/trpc";
import { Button } from "../ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";

export const teamFormSchema = z.object({
	id: z.string().optional(),
	name: z
		.string()
		.min(2, "Team name must be at least 2 characters")
		.max(50, "Team name must be at most 50 characters"),
	email: z.string().email("Invalid email address"),
	description: z
		.string()
		.max(500, "Description must be at most 500 characters")
		.optional(),
});

export const TeamForm = ({
	defaultValues,
	scrollarea = true,
}: {
	defaultValues?: Partial<z.infer<typeof teamFormSchema>>;
	scrollarea?: boolean;
}) => {
	const canWriteTeam = useScopes(["team:write"]);
	const form = useZodForm(teamFormSchema, {
		defaultValues: {
			name: "",
			email: "",
			description: "",
			...defaultValues,
		},
		disabled: !canWriteTeam,
	});

	const { mutateAsync: createTeam } = useMutation(
		trpc.teams.create.mutationOptions(),
	);

	const { mutateAsync: updateTeam } = useMutation(
		trpc.teams.update.mutationOptions(),
	);

	const handleSubmit = async (data: z.infer<typeof teamFormSchema>) => {
		if (data.id) {
			// Update existing team
			await updateTeam({
				...data,
				id: data.id,
			});
			queryClient.invalidateQueries(trpc.teams.getCurrent.queryOptions());
			queryClient.invalidateQueries(trpc.users.getCurrent.queryOptions());
		} else {
			const team = await createTeam({
				...data,
			});
			queryClient.invalidateQueries(trpc.teams.getAvailable.queryOptions());
			// Create new team
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				{/* <ScrollArea className={scrollarea ? "h-[calc(100vh-140px)]" : ""}> */}
				<div className={cn("space-y-4 px-4")}>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input placeholder="ACME" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input placeholder="acme@example.com" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Description</FormLabel>
								<FormControl>
									<Textarea
										placeholder="ACME is a company that specializes in..."
										className="min-h-[200px]"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				{/* </ScrollArea> */}
				{canWriteTeam && (
					<div className="flex items-center justify-end px-4">
						<Button type="submit">Save</Button>
					</div>
				)}
			</form>
		</Form>
	);
};
