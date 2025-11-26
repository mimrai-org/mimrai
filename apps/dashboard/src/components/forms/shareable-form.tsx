import { getShareablePermalink } from "@mimir/utils/shareable";
import { useMutation } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@ui/components/ui/alert";
import { Button } from "@ui/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
} from "@ui/components/ui/form";
import { Input } from "@ui/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/ui/select";
import { CheckIcon, CopyCheck, CopyCheckIcon, CopyIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { useShareableParams } from "@/hooks/use-shareable-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { queryClient, trpc } from "@/utils/trpc";

const schema = z.object({
	id: z.string().optional(),
	resourceId: z.string(),
	resourceType: z.string(),
	policy: z.string(),
	authorizedEmails: z.string().optional(),
});

export const ShareableForm = ({
	defaultValues,
}: {
	defaultValues?: Partial<z.infer<typeof schema>>;
}) => {
	const { setParams } = useShareableParams();
	const [isCopied, setIsCopied] = useState(false);
	const form = useZodForm(schema, {
		defaultValues: {
			...defaultValues,
		},
	});

	const { mutate, isPending } = useMutation(
		trpc.shareable.upsert.mutationOptions({
			onMutate: () => {
				toast.loading("Saving shareable...", {
					id: "saving-shareable",
				});
			},
			onSuccess: (shareable) => {
				if (!shareable) return;
				toast.success("Shareable saved", {
					id: "saving-shareable",
				});
				queryClient.setQueryData(
					trpc.shareable.getByResourceId.queryKey({
						resourceId: shareable.resourceId,
						resourceType: shareable.resourceType,
					}),
					shareable,
				);
				form.setValue("id", shareable.id);
			},
			onError: () => {
				toast.error("Failed to save shareable", {
					id: "saving-shareable",
				});
			},
		}),
	);

	const { mutate: deleteShareable, isPending: isDeleting } = useMutation(
		trpc.shareable.delete.mutationOptions({
			onMutate: () => {
				toast.loading("Deleting shareable...", {
					id: "deleting-shareable",
				});
			},
			onSuccess: () => {
				toast.success("Shareable deleted", {
					id: "deleting-shareable",
				});
				form.setValue("id", undefined);
				queryClient.invalidateQueries(
					trpc.shareable.getByResourceId.queryOptions({
						resourceId: form.getValues().resourceId,
						resourceType: form.getValues().resourceType,
					}),
				);
				setParams({ createShareable: null });
			},
			onError: () => {
				toast.error("Failed to delete shareable", {
					id: "deleting-shareable",
				});
			},
		}),
	);

	const handleSubmit = (values: z.infer<typeof schema>) => {
		const authorizedEmailsArray = values.authorizedEmails
			?.split(",")
			.map((email) => email.trim())
			.filter((email) => email.length > 0);
		mutate({
			...values,
			authorizedEmails: authorizedEmailsArray || [],
		});
	};

	const handleCopy = (text: string) => {
		navigator.clipboard.writeText(text);
		setIsCopied(true);
		setTimeout(() => setIsCopied(false), 2000);
	};

	const policy = form.watch("policy");
	const id = form.watch("id");

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				<FormField
					name="policy"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Select value={field.value} onValueChange={field.onChange}>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select a policy" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="private">Private</SelectItem>
										<SelectItem value="public">Public</SelectItem>
									</SelectContent>
								</Select>
							</FormControl>
							<FormDescription>
								Select the sharing policy for this resource.
							</FormDescription>
						</FormItem>
					)}
				/>
				{policy === "private" && (
					<FormField
						name="authorizedEmails"
						control={form.control}
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input
										placeholder="Authorized Emails (comma separated)"
										{...field}
									/>
								</FormControl>
							</FormItem>
						)}
					/>
				)}

				{policy === "public" && (
					<Alert>
						<AlertDescription>
							Anyone with the link will be able to access this resource.
						</AlertDescription>
					</Alert>
				)}

				{id && (
					<button
						type="button"
						className="group w-full"
						onClick={() => handleCopy(getShareablePermalink(id))}
					>
						<Alert>
							{isCopied ? (
								<CopyCheckIcon className="zoom-in-50 size-3.5 animate-in duration-200" />
							) : (
								<CopyIcon className="size-3 text-muted-foreground! group-hover:text-foreground!" />
							)}

							<AlertDescription>{getShareablePermalink(id)}</AlertDescription>
						</Alert>
					</button>
				)}

				<div className="flex justify-end gap-2">
					<Button
						variant="ghost"
						type="button"
						size="sm"
						onClick={() => setParams({ createShareable: null })}
					>
						Cancel
					</Button>
					{defaultValues?.id && (
						<Button
							size={"sm"}
							variant={"secondary"}
							type="button"
							disabled={isDeleting}
							onClick={() => {
								deleteShareable({
									resourceId: form.getValues().resourceId,
									resourceType: form.getValues().resourceType,
								});
							}}
						>
							Unshare
						</Button>
					)}
					<Button disabled={isPending} type="submit" size="sm">
						{id ? "Update" : "Share"}
					</Button>
				</div>
			</form>
		</Form>
	);
};
