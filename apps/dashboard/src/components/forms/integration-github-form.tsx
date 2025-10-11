import { getApiUrl } from "@mimir/utils/envs";
import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react";
import z from "zod";
import { useUser } from "@/hooks/use-user";
import { useZodForm } from "@/hooks/use-zod-form";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

const schema = z.object({
	token: z.string().min(1, "Token ID is required"),
	url: z.string().url("Invalid URL"),
});

export const IntegrationGithubForm = ({
	integrationId,
	onSubmit,
	defaultValues,
	isValid,
	error,
}: {
	integrationId: string;
	onSubmit: (data: z.infer<typeof schema>) => void;
	defaultValues?: Partial<z.infer<typeof schema>>;
	isValid: boolean;
	error: string | null;
}) => {
	const user = useUser();
	const form = useZodForm(schema, {
		defaultValues: {
			token: "",
			url: "",
			...defaultValues,
		},
	});

	const handleAuthorize = () => {
		// const url = new URL("https://github.com/login/oauth/authorize");
		// url.searchParams.append(
		// 	"client_id",
		// 	process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!,
		// );
		// const redirectUrl = new URL(`${getApiUrl()}/webhooks/github/setup`);
		// redirectUrl.searchParams.append("teamId", user?.team?.id!);
		// url.searchParams.append("redirect_uri", redirectUrl.toString());
		// window.open(url.toString(), "_blank", "noopener,noreferrer");

		const url = new URL(
			`https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_NAME}/installations/new`,
		);
		window.open(url.toString(), "_blank", "noopener,noreferrer");
	};

	const handleSubmit = async (data: z.infer<typeof schema>) => {
		onSubmit(data);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				<Button type="button" onClick={handleAuthorize}>
					Authorize GitHub
				</Button>
			</form>
		</Form>
	);
};
