import { t } from "@mimir/locale";
import { LOCALES } from "@mimir/locale/constants";
import { Button } from "@mimir/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@mimir/ui/form";
import { Input } from "@mimir/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@mimir/ui/select";
import { getApiUrl } from "@mimir/utils/envs";
import { useMutation } from "@tanstack/react-query";
import {
	ImagePlusIcon,
	Loader2Icon,
	UserCircleIcon,
	UserIcon,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import Loader from "@/components/loader";
import { useZodForm } from "@/hooks/use-zod-form";
import { queryClient, trpc } from "@/utils/trpc";

const schema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters long"),
	email: z.email("Invalid email address"),
	image: z.url().optional(),
	locale: z.string().optional(),
});

export const ProfileForm = ({
	defaultValues,
}: {
	defaultValues?: Partial<z.infer<typeof schema>>;
}) => {
	const [uploading, setUploading] = useState(false);
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

	const handleUploadAvatarChange = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setUploading(true);

		const formData = new FormData();
		formData.append("file", file);

		const response = await fetch(`${getApiUrl()}/api/attachments/upload`, {
			method: "POST",
			body: formData,
			credentials: "include",
		});

		const data = await response.json();
		const url = data.url as string;

		form.setValue("image", url, { shouldDirty: true });
		setUploading(false);
	};

	const handleSubmit = (data: z.infer<typeof schema>) => {
		updateProfile(data);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				<div className="flex">
					<div className="flex-1 space-y-4">
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
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input {...field} disabled />
									</FormControl>
								</FormItem>
							)}
						/>
					</div>

					<div className="flex w-62 justify-center">
						<FormField
							control={form.control}
							name="image"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<div>
											<input
												type="file"
												className="hidden"
												onChange={handleUploadAvatarChange}
												id="profile-avatar-input"
											/>
											<label htmlFor="profile-avatar-input">
												{uploading ? (
													<div className="flex size-32 items-center justify-center rounded-full bg-muted text-muted-foreground">
														<Loader />
													</div>
												) : field.value ? (
													<Image
														src={field.value}
														alt="Avatar"
														width={128}
														height={128}
														className="size-32 rounded-full border object-cover outline-4 outline-transparent outline-offset-2 transition-all hover:outline-accent hover:brightness-120"
													/>
												) : (
													<div
														title="Update avatar"
														className="flex size-32 items-center justify-center rounded-full border border-dashed bg-muted/30 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
													>
														<ImagePlusIcon className="size-8 stroke-1" />
													</div>
												)}
											</label>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</div>

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
