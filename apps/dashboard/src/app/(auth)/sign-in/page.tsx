import { Suspense } from "react";
import SignInForm from "@/components/sign-in-form";

export default function LoginPage() {
	return (
		<Suspense>
			<SignInForm />
		</Suspense>
	);
}
