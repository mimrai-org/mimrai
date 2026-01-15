"use client";
import { t } from "@mimir/locale";
import { DEFAULT_LOCALE, LOCALES } from "@mimir/locale/constants";
import { getTimezones } from "@mimir/locale/timezones";
import { Button } from "@mimir/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@mimir/ui/command";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@mimir/ui/form";
import { Input } from "@mimir/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@mimir/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@mimir/ui/select";
import { Textarea } from "@mimir/ui/textarea";
import { generateTeamSlug } from "@mimir/utils/teams";
import { PopoverClose } from "@radix-ui/react-popover";
import { useMutation } from "@tanstack/react-query";
import { ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { useUser } from "@/components/user-provider";
import { useScopes } from "@/hooks/use-scopes";
import { useTeamParams } from "@/hooks/use-team-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import { queryClient, trpc } from "@/utils/trpc";

export const teamFormSchema = z.object({
	id: z.string().optional(),
	name: z
		.string()
		.min(2, "Team name must be at least 2 characters")
		.max(50, "Team name must be at most 50 characters"),
	slug: z
		.string()
		.min(2, "Slug must be at least 2 characters")
		.max(30, "Slug must be at most 30 characters"),
	email: z.string().email("Invalid email address"),
	description: z
		.string()
		.max(500, "Description must be at most 500 characters")
		.optional(),
	locale: z.string().optional(),
	timezone: z.string().optional(),
});

export const TeamForm = ({
	defaultValues,
	scrollarea = true,
}: {
	defaultValues?: Partial<z.infer<typeof teamFormSchema>>;
	scrollarea?: boolean;
}) => {
	const { setParams } = useTeamParams();
	const [openTimezone, setOpenTimezone] = useState(false);
	const user = useUser();
	const canWriteTeam = useScopes(["team:write"]) && !!defaultValues?.id;
	const form = useZodForm(teamFormSchema, {
		defaultValues: {
			name: "",
			email: user?.email || "",
			description: "",
			slug: "",
			locale: DEFAULT_LOCALE,
			...defaultValues,
		},
		disabled: !canWriteTeam && !!defaultValues?.id,
	});

	const name = form.watch("name");

	useEffect(() => {
		if (!defaultValues?.id) {
			const slug = generateTeamSlug(name || "");
			form.setValue("slug", slug);
		}
	}, [name]);

	useEffect(() => {
		form.setValue("email", user?.email || "");
	}, [user?.email]);

	const { mutateAsync: switchTeam } = useMutation(
		trpc.users.switchTeam.mutationOptions(),
	);

	const { mutateAsync: createTeam, isPending: isCreating } = useMutation(
		trpc.teams.create.mutationOptions({
			onSuccess: async (team) => {
				setParams(null);
				await switchTeam({ slug: team.slug });
				window.location.href = `/team/${team.slug}/onboarding`;
			},
		}),
	);

	const { mutateAsync: updateTeam, isPending: isUpdating } = useMutation(
		trpc.teams.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.teams.getCurrent.queryOptions());
				queryClient.invalidateQueries(trpc.users.getCurrent.queryOptions());
				toast.success("Team updated successfully");
			},
		}),
	);

	const handleSubmit = async (data: z.infer<typeof teamFormSchema>) => {
		if (data.id) {
			// Update existing team
			await updateTeam({
				...data,
				id: data.id,
			});
		} else {
			const team = await createTeam({
				...data,
			});

			// Create new team
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				{/* <ScrollArea className={scrollarea ? "h-[calc(100vh-140px)]" : ""}> */}
				<div className={cn("space-y-4")}>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("forms.teamForm.name.label")}</FormLabel>
								<FormControl>
									<Input placeholder="ACME" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{!defaultValues?.id && (
						<FormField
							control={form.control}
							name="slug"
							render={({ field }) => (
								<FormItem>
									<FormLabel>URL</FormLabel>
									<FormControl>
										<div className="relative">
											<div className="pointer-events-none absolute top-0 left-0 flex h-full items-center pl-3 text-muted-foreground text-sm">
												https://mimrai.com/
											</div>
											<Input
												placeholder="acme"
												{...field}
												value={field.value || ""}
												className="pl-[141px]"
											/>
										</div>
									</FormControl>
									<FormDescription>
										{t("forms.teamForm.slug.description")}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}

					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("forms.teamForm.email.label")}</FormLabel>
								<FormControl>
									<Input placeholder="acme@example.com" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="locale"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("forms.teamForm.locale.label")}</FormLabel>
								<FormControl>
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger className="w-full">
											<SelectValue
												placeholder={t("forms.teamForm.locale.placeholder")}
												{...field}
											/>
										</SelectTrigger>
										<SelectContent>
											{LOCALES.map((locale) => (
												<SelectItem key={locale.code} value={locale.code}>
													{locale.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="timezone"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("forms.teamForm.timezone.label")}</FormLabel>
								<FormControl>
									<Popover open={openTimezone} onOpenChange={setOpenTimezone}>
										<PopoverTrigger className="w-full" asChild>
											{/* <SelectValue placeholder="Select a timezone" {...field} /> */}
											<Button
												type="button"
												variant="outline"
												className="w-full justify-between"
											>
												{getTimezones().find((tz) => tz.tzCode === field.value)
													?.name || (
													<span className="text-muted-foreground">
														{t("forms.teamForm.timezone.placeholder")}
													</span>
												)}
												<ChevronDown className="ml-2 size-4 text-muted-foreground" />
											</Button>
										</PopoverTrigger>
										<PopoverContent align="start" className="w-92">
											<Command>
												<CommandInput placeholder="Search timezone..." />
												<CommandEmpty>No timezone found.</CommandEmpty>
												<CommandGroup>
													{getTimezones().map((tz) => (
														<CommandItem
															value={tz.tzCode}
															key={tz.tzCode}
															onSelect={() => {
																field.onChange(tz.tzCode);
																setOpenTimezone(false);
															}}
														>
															{tz.name}
														</CommandItem>
													))}
												</CommandGroup>
											</Command>
										</PopoverContent>
									</Popover>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{defaultValues?.id && (
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("forms.teamForm.description.label")}</FormLabel>
									<FormControl>
										<Textarea
											placeholder={t("forms.teamForm.description.placeholder")}
											className="min-h-[200px]"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}
				</div>
				{/* </ScrollArea> */}
				{(canWriteTeam || !defaultValues?.id) && (
					<div className="flex items-center justify-end px-4">
						<Button type="submit" disabled={isUpdating || isCreating}>
							{(isUpdating || isCreating) && (
								<Loader2 className="animate-spin" />
							)}
							Save
						</Button>
					</div>
				)}
			</form>
		</Form>
	);
};
