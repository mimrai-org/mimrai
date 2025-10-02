import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react";
import z from "zod/v3";
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

export const IntegrationMattermostForm = ({
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
	const form = useZodForm(schema, {
		defaultValues: {
			token: "",
			url: "",
			...defaultValues,
		},
	});

	const handleSubmit = async (data: z.infer<typeof schema>) => {
		onSubmit(data);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				<FormField
					name="token"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Access Token</FormLabel>
							<FormControl>
								<Input
									placeholder="Enter your bot access token"
									type="password"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					name="url"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>URL</FormLabel>
							<FormControl>
								<Input placeholder="Enter your Mattermost URL" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{(error || isValid) && (
					<Alert variant={error ? "destructive" : "default"}>
						{error ? <XCircleIcon /> : <CheckCircle2Icon />}
						<AlertTitle>
							{error
								? "Validation failed"
								: isValid
									? "Configuration is valid"
									: ""}
						</AlertTitle>
						{error && <AlertDescription>{error}</AlertDescription>}
					</Alert>
				)}

				<div className="mt-6 flex justify-end">
					<Button type="submit" disabled={form.formState.isSubmitting}>
						{form.formState.isSubmitting && (
							<Loader2Icon className="size-4 animate-spin" />
						)}
						{isValid ? (integrationId ? "Update" : "Install") : "Validate"}
					</Button>
				</div>
			</form>
		</Form>
	);
};
