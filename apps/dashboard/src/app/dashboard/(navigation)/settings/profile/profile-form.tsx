import { t } from "@mimir/locale";
import { LOCALES } from "@mimir/locale/constants";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useZodForm } from "@/hooks/use-zod-form";
import { queryClient, trpc } from "@/utils/trpc";

const schema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters long"),
	locale: z.string().optional(),
});

export const ProfileForm = ({
	defaultValues,
}: {
	defaultValues?: Partial<z.infer<typeof schema>>;
}) => {
	const form = useZodForm(schema, {
		defaultValues: {
			name: "",
			locale: "en-US",
			...defaultValues,
		},
	});

	const { mutate: updateProfile, isPending } = useMutation(
		trpc.users.updateProfile.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.users.getCurrent.queryOptions());
				toast.success(t("toasts.profileUpdated"));
			},
		}),
	);

	const handleSubmit = (data: z.infer<typeof schema>) => {
		updateProfile(data);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="locale"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("forms.teamForm.locale.label")}</FormLabel>
							<FormControl>
								<Select value={field.value} onValueChange={field.onChange}>
									<SelectTrigger className="w-full">
										<SelectValue
											placeholder={t("forms.teamForm.locale.placeholder")}
											{...field}
										/>
									</SelectTrigger>
									<SelectContent>
										{LOCALES.map((locale) => (
											<SelectItem key={locale.code} value={locale.code}>
												{locale.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end">
					<Button type="submit" disabled={isPending}>
						{isPending && <Loader2Icon className="animate-spin" />}
						{t("common.saveChanges")}
					</Button>
				</div>
			</form>
		</Form>
	);
};
