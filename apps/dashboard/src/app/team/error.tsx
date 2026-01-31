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

	useEffect(() => {
		if (isAuthenticationError) {
			window.location.href = "/sign-in";
		}
	}, [isAuthenticationError]);

	return (
		<div className="flex h-screen w-full flex-col items-center justify-center gap-4">
			<h2 className="text-2xl">Ups, something went wrong</h2>
			<Button
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
