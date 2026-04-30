import { getWebsiteUrl } from "@mimir/utils/envs";
import { Button } from "@ui/components/ui/button";
import { ChevronLeftIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import SignInForm from "@/components/sign-in-form";

export default function LoginPage() {
	return (
		<div className="grid md:grid-cols-2">
			<div className="hidden h-screen w-full flex-col gap-4 p-8 md:flex">
				<div className="flex justify-between">
					<Logo className="size-8 rounded-full" />
					<Link href={getWebsiteUrl()}>
						<Button variant={"ghost"} className="">
							<ChevronLeftIcon />
							Back to Home
						</Button>
					</Link>
				</div>
				<Image
					src={"/cover4.png"}
					width={1600}
					height={900}
					alt="Login Image"
					className="h-screen w-full rounded-lg object-cover"
				/>
			</div>
			<div className="relative flex h-screen flex-col">
				<Suspense>
					<SignInForm />
				</Suspense>
			</div>
		</div>
	);
}
