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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { useAuthParams } from "@/hooks/use-auth-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { authClient } from "@/lib/auth-client";
import Loader from "./loader";

const schema = z.object({
	email: z.string().email("Invalid email address"),
});

export default function ForgotPasswordForm() {
	useAuthParams();
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const { isPending } = authClient.useSession();

	const form = useZodForm(schema, {
		defaultValues: {
			email: "",
		},
	});

	const handleSubmit = async (data: z.infer<typeof schema>) => {
		setLoading(true);
		await authClient.requestPasswordReset(
			{
				email: data.email,
			},
			{
				onSuccess: async () => {
					toast.success("Password reset email sent");
					setLoading(false);
					setSuccess(true);
				},
				onError: (ctx) => {
					toast.error(ctx.error.message || ctx.error.statusText);
					setLoading(false);
				},
			},
		);
	};

	if (success) {
		return (
			<div className="mx-auto my-auto w-full max-w-lg p-6 text-start">
				<h1 className="mb-2 font-semibold text-3xl">Check your email</h1>
				<p className="mb-4 text-muted-foreground">
					If an account with that email exists, we have sent a password reset
					link to your email.
				</p>
				<Link href="/sign-in">
					<Button variant="default" className="">
						Return to Sign In
					</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="mx-auto my-auto w-full max-w-lg p-6 text-start">
			<h1 className="mb-4 font-semibold text-3xl">Reset your password</h1>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input placeholder="jhondoe@example.com" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button
						type="submit"
						className="w-full"
						disabled={isPending || loading}
					>
						{(isPending || loading) && <Loader />}
						Reset Password
					</Button>
				</form>
			</Form>
		</div>
	);
}
