"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
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

const signUpSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function SignUpForm() {
	useAuthParams();
	const router = useRouter();
	const { isPending } = authClient.useSession();

	const form = useZodForm(signUpSchema, {
		defaultValues: {
			email: "",
			password: "",
			name: "",
		},
	});

	const handleSubmit = async (data: z.infer<typeof signUpSchema>) => {
		await authClient.signUp.email(
			{
				email: data.email,
				password: data.password,
				name: data.name,
			},
			{
				onSuccess: () => {
					const callbackUrl =
						localStorage.getItem("callbackUrl") ?? "/dashboard";
					router.push(callbackUrl);
					localStorage.removeItem("callbackUrl");
					toast.success("Sign up successful");
				},
				onError: (error) => {
					toast.error(error.error.message || error.error.statusText);
				},
			},
		);
	};

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<h1 className="mb-6 text-center font-medium text-2xl">Create Account</h1>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input placeholder="John Doe" {...field} />
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
									<Input type="password" placeholder="" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button
						type="submit"
						className="w-full"
						disabled={form.formState.isSubmitting}
					>
						{form.formState.isSubmitting ? "Submitting..." : "Sign Up"}
					</Button>
				</form>
			</Form>

			<div className="mt-4 text-center">
				<Button
					variant="link"
					onClick={() => router.push("/sign-in")}
					className="text-indigo-600 hover:text-indigo-800"
				>
					Already have an account? Sign In
				</Button>
			</div>
		</div>
	);
}
