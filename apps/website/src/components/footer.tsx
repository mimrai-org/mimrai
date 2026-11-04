import Link from "next/link";
import type React from "react";
import { MIMRAI_URL, REPO_URL } from "@/lib/links";
import { Logo } from "./logo";

export const Footer: React.FC = () => {
	return (
		<footer className="border-white/5 border-t bg-background py-12 text-sm">
			<div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
				<div className="flex items-center gap-2">
					<Logo className="size-8 rounded-sm bg-white" />
					<span className="font-semibold text-white tracking-wide">
						MIMRAI <span className="text-zinc-500">Tasks</span>
					</span>
				</div>

				<div className="flex items-center gap-8 text-zinc-500">
					<Link
						href={`${MIMRAI_URL}/privacy`}
						className="transition-colors hover:text-white"
						target="_blank"
						rel="noopener noreferrer"
					>
						Privacy
					</Link>
					<Link
						href={REPO_URL}
						className="transition-colors hover:text-white"
						target="_blank"
						rel="noopener noreferrer"
					>
						GitHub
					</Link>
					<Link
						href={MIMRAI_URL}
						className="transition-colors hover:text-white"
						target="_blank"
						rel="noopener noreferrer"
					>
						mimrai.com
					</Link>
				</div>

				<div className="text-zinc-600">
					AGPL-3.0 &middot; by{" "}
					<Link href={MIMRAI_URL} className="hover:text-white">
						MIMRAI
					</Link>
				</div>
			</div>
		</footer>
	);
};
