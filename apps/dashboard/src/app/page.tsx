import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";

export default async function Home() {
	const session = await getSession();
	if (session?.user) return redirect("/dashboard");

	return redirect("/sign-in");
}
