import { getWebsiteUrl } from "@mimir/utils/envs";
import { Button } from "@ui/components/ui/button";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { getSession } from "@/lib/get-session";

export default async function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getSession();

	return (
		<div>
			<header className="container mx-auto mb-4 flex items-center justify-between px-6 py-4">
				<div className="flex items-center gap-8">
					<Logo className="rounded-full" />
					<div className="flex gap-2">
						<Link href={`${getWebsiteUrl()}`}>
							<Button size={"sm"} variant={"ghost"}>
								Home
							</Button>
						</Link>
					</div>
				</div>
				{!session?.user && (
					<Button size={"sm"} variant={"secondary"}>
						Sign in
					</Button>
				)}
			</header>
			<div className="container mx-auto max-w-4xl px-4 py-12">{children}</div>
		</div>
	);
}
