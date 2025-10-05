"use client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import z from "zod/v3";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/utils/trpc";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";

const schema = z.object({
	email: z.string().email("Invalid email address"),
});

export const MemberInviteForm = () => {
	const form = useZodForm(schema, {
		defaultValues: {
			email: "",
		},
	});

	const { mutateAsync: inviteMember } = useMutation(
		trpc.teams.invite.mutationOptions(),
	);

	const handleSubmit = async (data: z.infer<typeof schema>) => {
		try {
			await inviteMember({ email: data.email });
			form.reset();
		} catch (error) {
			toast.error("Failed to send invite.");
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				<FormField
					name="email"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input placeholder="jhondoe@example.com" {...field} />
							</FormControl>
						</FormItem>
					)}
				/>

				<div className="flex justify-end">
					<Button type="submit">Invite</Button>
				</div>
			</form>
		</Form>
	);
};
