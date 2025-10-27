"use client";
import { Button } from "@mimir/ui/button";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

export default function Home() {
	const healthCheck = useQuery(trpc.healthCheck.queryOptions());

	return (
		<div className="container mx-auto mt-32 max-w-3xl px-4 py-2">
			<h1 className="mb-4 text-6xl">
				Welcome to <span className="font-medium">Mimir</span>
			</h1>
			<p className="max-w-2xl text-balance text-lg text-muted-foreground">
				Mimir is the next generation AI task manager for developers. It helps
				you and your team stay organized, prioritize tasks, and get more done
				with the power of AI.
			</p>

			<div className="mt-4">
				<a href="/redirect">
					<Button variant={"outline"}>Get Started</Button>
				</a>
			</div>

			<div className="mt-12 grid gap-6">
				<section className="rounded-lg border p-4">
					<h2 className="mb-2 font-medium">API Status</h2>
					<div className="flex items-center gap-2">
						<div
							className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
						/>
						<span className="text-muted-foreground text-sm">
							{healthCheck.isLoading
								? "Checking..."
								: healthCheck.data
									? "Connected"
									: "Disconnected"}
						</span>
					</div>
				</section>
			</div>
		</div>
	);
}
