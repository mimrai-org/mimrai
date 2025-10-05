"use client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import z from "zod/v3";
import { useMemberParams } from "@/hooks/use-member-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { queryClient, trpc } from "@/utils/trpc";
import { Button } from "../ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
} from "../ui/form";
import { Textarea } from "../ui/textarea";

const schema = z.object({
	userId: z.string(),
	description: z
		.string()
		.min(2, "Description must be at least 2 characters")
		.max(100, "Description must be at most 100 characters"),
});

export const MemberUpdateForm = ({
	defaultValues,
}: {
	defaultValues: Partial<z.infer<typeof schema>>;
}) => {
	const { setParams } = useMemberParams();
	const form = useZodForm(schema, {
		defaultValues: {
			description: "",
			...defaultValues,
		},
	});

	const { mutate: updateMember } = useMutation(
		trpc.teams.updateMember.mutationOptions({
			onSuccess: (member) => {
				if (!member) return;

				queryClient.setQueryData(
					trpc.teams.getMemberById.queryKey({ userId: member.id }),
					member,
				);
				queryClient.invalidateQueries(trpc.teams.getMembers.queryOptions());
				setParams(null);
			},
			onError: () => {
				toast.error("Failed to update member.");
			},
		}),
	);

	const handleSubmit = async (data: z.infer<typeof schema>) => {
		try {
			updateMember({
				description: data.description,
				userId: data.userId,
			});
		} catch (error) {
			toast.error("Failed to update member.");
		}
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleSubmit)}
				className="space-y-4 px-4"
			>
				<FormField
					name="description"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description</FormLabel>
							<FormControl>
								<Textarea
									className="min-h-56"
									placeholder="Description"
									{...field}
								/>
							</FormControl>
							<FormDescription>
								A short description to identify the member, his role on the
								team.
							</FormDescription>
						</FormItem>
					)}
				/>

				<div className="flex justify-end">
					<Button type="submit">Save</Button>
				</div>
			</form>
		</Form>
	);
};
