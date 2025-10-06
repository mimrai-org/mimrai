import { Suspense } from "react";
import SignUpForm from "@/components/sign-up-form";

export default function Page() {
	return (
		<Suspense>
			<SignUpForm />
		</Suspense>
	);
}
