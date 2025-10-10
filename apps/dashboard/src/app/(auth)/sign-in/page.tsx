import Image from "next/image";
import SignInForm from "@/components/sign-in-form";

export default function LoginPage() {
	return (
		<div className="grid grid-cols-2">
			<div>
				<Image
					src={"/sign-in2.png"}
					width={1600}
					height={900}
					alt="Login Image"
					className="h-screen w-full object-cover"
				/>
			</div>
			<SignInForm />
		</div>
	);
}
