"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { useAuthParams } from "@/hooks/use-auth-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { authClient } from "@/lib/auth-client";
import Loader from "./loader";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const schema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function SignInForm() {
	useAuthParams();
	const router = useRouter();
	const { isPending } = authClient.useSession();

	const form = useZodForm(schema, {
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const handleSubmit = async (data: z.infer<typeof schema>) => {
		await authClient.signIn.email(
			{
				email: data.email,
				password: data.password,
			},
			{
				credentials: "include",
				mode: "cors",
				onSuccess: () => {
					const callbackUrl =
						localStorage.getItem("callbackUrl") ?? "/redirect";

					localStorage.removeItem("callbackUrl");
					toast.success("Sign in successful");
					window.location.href = callbackUrl;
				},
				onError: (ctx) => {
					if (ctx.error.status === 403) {
						toast.error("Your email is not verified. Please check your inbox.");
						return;
					}
					toast.error(ctx.error.message || ctx.error.statusText);
				},
			},
		);
	};

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<h1 className="mb-6 text-center font-medium text-2xl">Welcome Back</h1>
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
					<Button type="submit" className="w-full">
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
