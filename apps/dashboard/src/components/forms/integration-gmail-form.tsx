"use client";

import { Alert, AlertDescription, AlertTitle } from "@mimir/ui/alert";
import { Button } from "@mimir/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@mimir/ui/form";
import { Input } from "@mimir/ui/input";
import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react";
import { useEffect } from "react";
import z from "zod";
import { useZodForm } from "@/hooks/use-zod-form";

const schema = z.object({
	refreshToken: z.string().min(1, "Refresh token is required"),
});

export const IntegrationGmailForm = ({
	integrationId,
	onSubmit,
	defaultValues,
	isValid,
	error,
}: {
	integrationId: string;
	onSubmit: (data: z.infer<typeof schema>) => void;
	defaultValues?: Partial<z.infer<typeof schema>>;
	isValid: boolean;
	error: string | null;
}) => {
	const form = useZodForm(schema, {
		defaultValues: {
			refreshToken: "",
			...defaultValues,
		},
	});

	const handleSubmit = async (data: z.infer<typeof schema>) => {
		onSubmit(data);
	};

	const handleOAuthConnect = () => {
		// Redirect to backend OAuth flow on the API server
		const apiUrl =
			process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3003";
		window.location.href = `${apiUrl}/api/integrations/gmail/authorize`;
	};

	// Listen for successful OAuth callback
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.data?.type === "gmail-oauth-success") {
				// Auto-close or show success
				window.location.reload();
			}
		};

		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, []);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				<div className="space-y-4 rounded-lg border bg-muted/50 p-4">
					<h3 className="font-medium">Connect your Gmail account</h3>
					<p className="text-muted-foreground text-sm">
						Click below to authorize Mimir to access your Gmail. You'll be
						redirected to Google's secure login.
					</p>
					<Button
						type="button"
						variant="outline"
						onClick={handleOAuthConnect}
						className="w-full"
					>
						Connect with Google
					</Button>
				</div>

				<div className="text-center text-muted-foreground text-sm">- OR -</div>

				<FormField
					name="refreshToken"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Refresh Token (Manual)</FormLabel>
							<FormControl>
								<Input
									placeholder="Paste your refresh token here"
									type="password"
									{...field}
								/>
							</FormControl>
							<FormDescription>
								If you already have a refresh token, paste it here instead.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{(error || isValid) && (
					<Alert variant={error ? "destructive" : "default"}>
						{error ? <XCircleIcon /> : <CheckCircle2Icon />}
						<AlertTitle>
							{error
								? "Validation failed"
								: isValid
									? "Configuration is valid"
									: ""}
						</AlertTitle>
						{error && <AlertDescription>{error}</AlertDescription>}
					</Alert>
				)}

				<div className="mt-6 flex justify-end">
					<Button type="submit" disabled={form.formState.isSubmitting}>
						{form.formState.isSubmitting && (
							<Loader2Icon className="size-4 animate-spin" />
						)}
						{isValid ? (integrationId ? "Update" : "Install") : "Validate"}
					</Button>
				</div>
			</form>
		</Form>
	);
};
