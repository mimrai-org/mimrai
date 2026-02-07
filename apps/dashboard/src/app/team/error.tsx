"use client"; // Error boundaries must be Client Components

import { Button } from "@ui/components/ui/button";
import { useEffect } from "react";

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const isAuthenticationError = error.message.includes(
		"Authentication required",
	);

	// useEffect(() => {
	// 	if (isAuthenticationError) {
	// 		window.location.href = "/sign-in";
	// 	}
	// }, [isAuthenticationError]);

	return (
		<div className="mx-auto flex h-screen max-w-2xl flex-col items-center justify-center text-center">
			<h2 className="font-header text-6xl">
				{isAuthenticationError
					? "Your session has expired"
					: "Something went wrong"}
			</h2>
			<p className="mt-2 text-center text-muted-foreground">
				{isAuthenticationError
					? "This things happens. Please sign in again to continue enjoying MIMRAI"
					: "An unexpected error occurred. Please try reloading the page."}
			</p>
			<Button
				className="mt-12"
				variant="ghost"
				size="lg"
				onClick={() => {
					if (isAuthenticationError) {
						window.location.href = "/sign-in";
					} else {
						window.location.reload();
					}
				}}
			>
				{isAuthenticationError ? "Sign In" : "Reload Page"}
			</Button>
		</div>
	);
}
