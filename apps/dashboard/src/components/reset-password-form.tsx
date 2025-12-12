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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { useAuthParams } from "@/hooks/use-auth-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { authClient } from "@/lib/auth-client";
import Loader from "./loader";

const schema = z
	.object({
		newPassword: z.string().min(8).max(100).nonempty("Password is required"),
		confirmPassword: z
			.string()
			.min(8)
			.max(100)
			.nonempty("Please confirm your password"),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords do not match",
	});

export default function ResetPasswordForm() {
	const { token } = useAuthParams();
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	const form = useZodForm(schema, {
		defaultValues: {
			newPassword: "",
			confirmPassword: "",
		},
	});

	const handleSubmit = async (data: z.infer<typeof schema>) => {
		if (!token) {
			toast.error("Invalid or missing token");
			return;
		}
		setLoading(true);
		await authClient.resetPassword(
			{
				newPassword: data.newPassword,
				token,
			},
			{
				onSuccess: async () => {
					toast.success("Password reset successfully");
					router.push("/sign-in");
				},
				onError: (ctx) => {
					toast.error(ctx.error.message || ctx.error.statusText);
					setLoading(false);
				},
			},
		);
	};

	return (
		<div className="mx-auto my-auto w-full max-w-lg p-6 text-start">
			<h1 className="mb-4 font-semibold text-3xl">Reset your password</h1>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
					<FormField
						control={form.control}
						name="newPassword"
						render={({ field }) => (
							<FormItem>
								<FormLabel>New Password</FormLabel>
								<FormControl>
									<Input
										type="password"
										placeholder="New Password"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="confirmPassword"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Confirm Password</FormLabel>
								<FormControl>
									<Input
										type="password"
										placeholder="Confirm Password"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" className="w-full" disabled={loading}>
						{loading && <Loader />}
						Reset Password
					</Button>
				</form>
			</Form>
		</div>
	);
}
