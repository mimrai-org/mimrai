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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { useAuthParams } from "@/hooks/use-auth-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { authClient } from "@/lib/auth-client";
import Loader from "./loader";

const schema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function SignInForm() {
	useAuthParams();
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const { isPending, data } = authClient.useSession();

	const form = useZodForm(schema, {
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const handleSuccess = () => {
		const callbackUrl = localStorage.getItem("callbackUrl") ?? "/redirect";

		localStorage.removeItem("callbackUrl");
		toast.success("Sign in successful");
		window.location.href = callbackUrl;
	};

	const handleSubmit = async (data: z.infer<typeof schema>) => {
		setLoading(true);
		await authClient.signIn.email(
			{
				email: data.email,
				password: data.password,
			},
			{
				credentials: "include",
				mode: "cors",
				onSuccess: () => {
					handleSuccess();
				},
				onError: (ctx) => {
					if (ctx.error.status === 403) {
						toast.error("Your email is not verified. Please check your inbox.");
						return;
					}
					toast.error(ctx.error.message || ctx.error.statusText);
					setLoading(false);
				},
			},
		);
	};

	useEffect(() => {
		if (data?.user) {
			handleSuccess();
		}
	}, [data?.user]);

	return (
		<div className="mx-auto my-auto w-full max-w-lg p-6">
			<h1 className="mb-2 text-center font-semibold text-2xl">
				Nice to see you again
			</h1>
			<p className="mb-8 text-balance text-center text-muted-foreground">
				Welcome back! Enter your credentials to unlock your Mimir experience.
			</p>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input placeholder="jhondoe@example.com" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Password</FormLabel>
								<FormControl>
									<Input
										type="password"
										placeholder="Your password"
										{...field}
									/>
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
						Sign In
					</Button>
				</form>
			</Form>

			<div className="mt-4 text-center">
				<Button variant="link" onClick={() => router.push("/sign-up")}>
					Need an account? Sign Up
				</Button>
			</div>
		</div>
	);
}
