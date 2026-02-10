"use client";
import { getAppUrl } from "@mimir/utils/envs";
import { Button } from "@ui/components/ui/button";
import { GithubIcon, Menu, X } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useEffect, useState } from "react";
import { Logo } from "./logo";

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
						{/* <div className="h-5 w-5 rotate-45 bg-white" /> */}
						<span className="font-medium text-lg text-white tracking-wide">
							MIMRAI
						</span>
					</div>
				</Link>

				{/* Desktop Menu */}
				<div className="hidden items-center gap-8 md:flex">
					<Link
						href="#features"
						className="text-sm text-zinc-400 transition-colors hover:text-white"
					>
						Features
					</Link>
					<Link
						href="#product"
						className="text-sm text-zinc-400 transition-colors hover:text-white"
					>
						How it works
					</Link>
					<Link
						href="https://github.com/mimrai-org/mimrai"
						target="_blank"
						rel="noopener noreferrer"
						className="text-zinc-400 transition-colors hover:text-white"
					>
						<GithubIcon size={16} />
					</Link>
					<div className="mx-2 h-4 w-[1px] bg-white/10" />
					<Link
						href={`${getAppUrl()}/sign-in`}
						className="text-sm text-white hover:text-zinc-300"
					>
						Sign in
					</Link>
					<Link href={`${getAppUrl()}/sign-in`}>
						<Button variant="default" className="px-5 py-2 text-xs">
							Get Started
						</Button>
					</Link>
				</div>

				{/* Mobile Toggle */}
				<button
					type="button"
					className="text-white md:hidden"
					onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
				>
					{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
				</button>
			</div>

			{/* Mobile Menu */}
			{mobileMenuOpen && (
				<div className="slide-in-from-top-2 absolute top-full left-0 flex w-full animate-in flex-col gap-4 border-border border-b bg-background p-6 md:hidden">
					<a href="#features" className="text-sm text-zinc-400">
						Features
					</a>
					<a href="#product" className="text-sm text-zinc-400">
						How it works
					</a>
					<a href="#pricing" className="text-sm text-zinc-400">
						Pricing
					</a>
					<Button variant="default" className="w-full justify-center">
						Get Started
					</Button>
				</div>
			)}
		</nav>
	);
};
