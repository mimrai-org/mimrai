"use client";
import z from "zod/v3";
import { useZodForm } from "@/hooks/use-zod-form";
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

	const handleSubmit = (data: z.infer<typeof schema>) => {};

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
