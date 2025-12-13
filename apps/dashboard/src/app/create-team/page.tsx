"use client";
import { Button } from "@mimir/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@mimir/ui/form";
import { Input } from "@mimir/ui/input";
import { useMutation } from "@tanstack/react-query";
import { RocketIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import z from "zod";
import { useUser } from "@/hooks/use-user";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/utils/trpc";

const schema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	email: z.string().email(),
	description: z.string().optional(),
});

export default function Page() {
	const router = useRouter();
	const user = useUser();
	const form = useZodForm(schema, {
		defaultValues: {
			name: "",
			email: user?.email || "",
			description: "",
		},
	});

	useEffect(() => {
		if (user?.email) {
			form.setValue("email", user.email);
		}
	}, [user?.email]);

	const { mutateAsync: createTeam } = useMutation(
		trpc.teams.create.mutationOptions(),
	);

	const handleSubmit = async (data: z.infer<typeof schema>) => {
		const team = await createTeam(data);
		router.push(`/team/${team.slug}/onboarding`);
	};

	return (
		<div className="mx-auto my-auto">
			<div className="mb-6 max-w-md">
				<h1 className="mb-1 font-medium text-2xl">Create your team</h1>
				<p className="text-balance text-muted-foreground text-sm">
					The team is the core unit of collaboration in Mimir. You can always
					change this later.
				</p>
			</div>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(handleSubmit)}
					className="max-w-md space-y-4"
				>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input placeholder="Acme Inc." {...field} />
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

					<div className="mt-6 flex justify-start">
						<Button
							className="flex w-32 items-center justify-between"
							disabled={
								!form.formState.isValid ||
								form.formState.isSubmitting ||
								form.formState.isSubmitted
							}
							type="submit"
						>
							Dive in
							<RocketIcon />
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
