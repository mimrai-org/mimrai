"use client";
import { t } from "@mimir/locale";
import { Button } from "@mimir/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@mimir/ui/form";
import { Input } from "@mimir/ui/input";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import z from "zod";
import { useZodForm } from "@/hooks/use-zod-form";
import { queryClient, trpc } from "@/utils/trpc";

const schema = z.object({
	email: z.string().email("Invalid email address"),
});

export const MemberInviteForm = () => {
	const form = useZodForm(schema, {
		defaultValues: {
			email: "",
		},
	});

	const { mutate: inviteMember, isPending } = useMutation(
		trpc.teams.invite.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.teams.getInvites.queryOptions());
				form.reset();
				toast.success("Invite sent successfully!");
			},
			onError: (error) => {
				toast.error(
					error.message || "An error occurred while sending the invite.",
				);
			},
		}),
	);

	const handleSubmit = async (data: z.infer<typeof schema>) => {
		try {
			inviteMember({ email: data.email });
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
							<FormLabel>{t("forms.memberInviteForm.email.label")}</FormLabel>
							<FormControl>
								<Input placeholder="jhondoe@example.com" {...field} />
							</FormControl>
						</FormItem>
					)}
				/>

				<div className="flex justify-end">
					<Button type="submit" disabled={isPending}>
						{isPending && <Loader2Icon className="animate-spin" />}
						{t("forms.memberInviteForm.submitButton.label")}
					</Button>
				</div>
			</form>
		</Form>
	);
};
