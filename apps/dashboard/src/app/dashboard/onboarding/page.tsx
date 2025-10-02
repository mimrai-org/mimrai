import { redirect } from "next/navigation";

export default async function Page() {
	return redirect("/dashboard/onboarding/create-team");
}
