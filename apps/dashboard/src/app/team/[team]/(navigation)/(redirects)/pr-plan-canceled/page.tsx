export default function Page() {
	return (
		<div className="mx-auto my-auto max-w-2xl text-center">
			<h1 className="mb-4 font-medium text-5xl">The plan has been canceled.</h1>
			<p className="text-balance text-muted-foreground">
				If you canceled this by mistake, you can re create the plan reopning the
				PR or pushing new commits.
			</p>
		</div>
	);
}
