"use client";

import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { Input } from "@ui/components/ui/input";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";

export const Newsletter = () => {
	const [email, setEmail] = useState("");

	const { mutate: subscribe, isPending } = useMutation(
		trpc.newsletter.join.mutationOptions({
			onSuccess: () => {
				toast.success("Subscribed to newsletter!");
			},
		}),
	);

	const handleSubscribe = () => {
		if (!email) {
			toast.error("Please enter a valid email address.");
			return;
		}
		subscribe({ email });
		setEmail("");
	};

	return (
		<section className="relative overflow-hidden border-white/5 border-t bg-background py-24">
			<div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
				>
					<h2 className="mb-6 font-light text-3xl text-white md:text-4xl">
						Want to follow the progress?
					</h2>
					<p className="mx-auto mb-10 max-w-2xl font-light text-lg text-zinc-400 leading-relaxed">
						Mimrai’s free tier is open to explore, and the newsletter is where
						new features and small improvements land first. Join if you want to
						stay close to the build—quietly, at your own pace.
					</p>
				</motion.div>

				<motion.form
					initial={{ opacity: 0, y: 10 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6, delay: 0.2 }}
					className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
					onSubmit={(e) => e.preventDefault()}
				>
					<Input
						type="email"
						placeholder="enter@email.com"
						className="h-12 border-white/10 bg-white/5 focus:border-white/20"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
					<Button
						size="lg"
						className="h-12 px-8"
						disabled={isPending}
						onClick={handleSubscribe}
					>
						Subscribe
					</Button>
				</motion.form>
			</div>

			{/* Background glow */}
			<div className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 left-1/2 h-[300px] w-[500px] rounded-full bg-white/[0.02] blur-[100px]" />
		</section>
	);
};
