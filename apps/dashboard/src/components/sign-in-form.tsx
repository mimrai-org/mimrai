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
import { getAppUrl, getWebsiteUrl } from "@mimir/utils/envs";
import { MailIcon } from "lucide-react";
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
		const callbackUrl = localStorage.getItem("callbackUrl") ?? "/team";

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

	const handleSocialSignIn = async (provider: string) => {
		setLoading(true);
		await authClient.signIn.social(
			{
				provider,
				callbackURL: `${getAppUrl()}/redirect`,
			},
			{
				credentials: "include",
				mode: "cors",
				onSuccess: () => {
					handleSuccess();
				},
				onError: (ctx) => {
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
		<div className="mx-auto my-auto w-full max-w-lg p-6 text-start">
			<h1 className="font-medium text-3xl">Nice to see you again</h1>
			<p className="mb-4 text-balance text-muted-foreground">
				<Link href="/sign-up">
					<Button variant="link" type="button" className="px-0">
						Need an account? Sign Up
					</Button>
				</Link>
			</p>
			<div className="space-y-4">
				<Button
					className="w-full"
					onClick={() => {
						handleSocialSignIn("google");
					}}
					disabled={loading}
				>
					<svg
						className="invert dark:invert-0"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 512 512"
					>
						<path d="M500 261.8C500 403.3 403.1 504 260 504 122.8 504 12 393.2 12 256S122.8 8 260 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9c-88.3-85.2-252.5-21.2-252.5 118.2 0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9l-140.8 0 0-85.3 236.1 0c2.3 12.7 3.9 24.9 3.9 41.4z" />
					</svg>
					Sign in with Google
				</Button>
				<Button
					className="w-full"
					onClick={() => {
						handleSocialSignIn("github");
					}}
					disabled={loading}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 512 512"
						className="invert dark:invert-0"
					>
						<path d="M173.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3 .3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5 .3-6.2 2.3zm44.2-1.7c-2.9 .7-4.9 2.6-4.6 4.9 .3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM252.8 8c-138.7 0-244.8 105.3-244.8 244 0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1 100-33.2 167.8-128.1 167.8-239 0-138.7-112.5-244-251.2-244zM105.2 352.9c-1.3 1-1 3.3 .7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3 .3 2.9 2.3 3.9 1.6 1 3.6 .7 4.3-.7 .7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3 .7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3 .7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9s4.3 3.3 5.6 2.3c1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z" />
					</svg>
					Sign in with Github
				</Button>
				<Button
					className="w-full"
					onClick={() => {
						handleSocialSignIn("twitter");
					}}
					disabled={loading}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 448 512"
						className="invert dark:invert-0"
					>
						<path d="M357.2 48L427.8 48 273.6 224.2 455 464 313 464 201.7 318.6 74.5 464 3.8 464 168.7 275.5-5.2 48 140.4 48 240.9 180.9 357.2 48zM332.4 421.8l39.1 0-252.4-333.8-42 0 255.3 333.8z" />
					</svg>
					Sign in with X
				</Button>
			</div>
			<hr className="my-6" />
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
						{isPending || loading ? <Loader /> : <MailIcon />}
						Sign In
					</Button>
				</form>
			</Form>

			<div className="mt-4 text-center">
				<Link href="/forgot-password">
					<Button variant="link" type="button" className="px-0">
						Forgot your password?
					</Button>
				</Link>
			</div>
			<div className="absolute inset-x-0 bottom-12 text-center text-muted-foreground text-xs">
				By signing in you agree to our{" "}
				<Link href={`${getWebsiteUrl()}/policy`} className="underline">
					Privacy policy
				</Link>
			</div>
		</div>
	);
}
