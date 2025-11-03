import { redirect } from "next/navigation";

type Props = {
	searchParams: Promise<{
		[key: string]: string | string[] | undefined;
	}>;
};

export default async function Page({ searchParams }: Props) {
	const paramsToRedirect = await searchParams;
	const queryString = new URLSearchParams(
		paramsToRedirect as Record<string, string>,
	).toString();
	return redirect(`/dashboard/overview?${queryString}`);
}
