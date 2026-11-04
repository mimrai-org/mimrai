"use client";
import { Button } from "@ui/components/ui/button";
import { GithubIcon, Menu, X } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useEffect, useState } from "react";
import { REPO_URL, TEMPLATE_URL } from "@/lib/links";
import { Logo } from "./logo";

const sections = [
	{ href: "#product", label: "How it works" },
	{ href: "#features", label: "Features" },
];

export const Navbar: React.FC = () => {
	const [scrolled, setScrolled] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	useEffect(() => {
		const handleScroll = () => setScrolled(window.scrollY > 50);
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<nav
			className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? "border-border border-b bg-background py-3" : "bg-transparent py-6"}`}
		>
			<div className="mx-auto flex max-w-7xl items-center justify-between px-6">
				<Link href="/">
					<div className="flex items-center gap-2">
						<Logo className="rounded-sm" />
						<span className="font-medium text-lg text-white tracking-wide">
							MIMRAI <span className="text-zinc-500">Tasks</span>
						</span>
					</div>
				</Link>

				<div className="hidden items-center gap-8 md:flex">
					{sections.map((section) => (
						<Link
							key={section.href}
							href={section.href}
							className="text-sm text-zinc-400 transition-colors hover:text-white"
						>
							{section.label}
						</Link>
					))}
					<Link
						href={REPO_URL}
						target="_blank"
						rel="noopener noreferrer"
						aria-label="GitHub repository"
						className="text-zinc-400 transition-colors hover:text-white"
					>
						<GithubIcon size={16} />
					</Link>
					<div className="mx-2 h-4 w-[1px] bg-white/10" />
					<Link href={TEMPLATE_URL} target="_blank" rel="noopener noreferrer">
						<Button variant="default" className="px-5 py-2 text-xs">
							Use this template
						</Button>
					</Link>
				</div>

				<button
					type="button"
					aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
					className="text-white md:hidden"
					onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
				>
					{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
				</button>
			</div>

			{mobileMenuOpen && (
				<div className="slide-in-from-top-2 absolute top-full left-0 flex w-full animate-in flex-col gap-4 border-border border-b bg-background p-6 md:hidden">
					{sections.map((section) => (
						<a
							key={section.href}
							href={section.href}
							className="text-sm text-zinc-400"
							onClick={() => setMobileMenuOpen(false)}
						>
							{section.label}
						</a>
					))}
					<a
						href={REPO_URL}
						target="_blank"
						rel="noopener noreferrer"
						className="text-sm text-zinc-400"
					>
						GitHub
					</a>
					<Link href={TEMPLATE_URL} target="_blank" rel="noopener noreferrer">
						<Button variant="default" className="w-full justify-center">
							Use this template
						</Button>
					</Link>
				</div>
			)}
		</nav>
	);
};
