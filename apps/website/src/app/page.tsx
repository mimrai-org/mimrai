import { Button } from "@mimir/ui/button";

export default function Home() {
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
		</div>
	);
}
