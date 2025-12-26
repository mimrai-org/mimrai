"use client";

import { Button } from "@mimir/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@mimir/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Editor as EditorInstance } from "@tiptap/react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { useRef } from "react";
import { toast } from "sonner";
import { z } from "zod/v3";
import { useProjectHealthUpdateParams } from "@/hooks/use-project-health-update-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/utils/trpc";
import { Editor } from "../../editor";
import Loader from "../../loader";
import {
	healthOptions,
	ProjectHealthIcon,
	ProjectHealthLabel,
} from "./project-health-icon";

const schema = z.object({
	id: z.string().optional(),
	health: z.enum(["on_track", "at_risk", "off_track"]),
	summary: z.string().max(5000).optional().nullable(),
});

export const ProjectHealthUpdateForm = ({
	projectId,
	defaultValues,
}: {
	projectId: string;
	defaultValues?: Partial<z.infer<typeof schema>>;
}) => {
	const editorRef = useRef<EditorInstance>(null);
	const queryClient = useQueryClient();
	const { setParams } = useProjectHealthUpdateParams();
	const isEditing = Boolean(defaultValues?.id);

	const form = useZodForm(schema, {
		defaultValues: {
			health: "on_track",
			summary: "",
			...defaultValues,
		},
	});

	const { mutate: createHealthUpdate, isPending: isCreating } = useMutation(
		trpc.projectHealthUpdates.create.mutationOptions({
			onMutate: () => {
				toast.loading("Creating health update...", {
					id: "create-health-update",
				});
			},
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.projectHealthUpdates.getLatest.queryOptions({ projectId }),
				);
				queryClient.invalidateQueries(
					trpc.projectHealthUpdates.get.queryOptions({ projectId }),
				);
				toast.success("Health update created", {
					id: "create-health-update",
				});
				form.reset();
				if (editorRef.current) {
					editorRef.current.commands.setContent("");
				}
			},
			onError: (error) => {
				toast.error(error.message || "Failed to create health update", {
					id: "create-health-update",
				});
			},
		}),
	);

	const { mutate: updateHealthUpdate, isPending: isUpdating } = useMutation(
		trpc.projectHealthUpdates.update.mutationOptions({
			onMutate: () => {
				toast.loading("Updating health update...", {
					id: "update-health-update",
				});
			},
			onSuccess: () => {
				queryClient.invalidateQueries(
					trpc.projectHealthUpdates.getLatest.queryOptions({ projectId }),
				);
				queryClient.invalidateQueries(
					trpc.projectHealthUpdates.get.queryOptions({ projectId }),
				);
				toast.success("Health update updated", {
					id: "update-health-update",
				});
				setParams(null);
			},
			onError: (error) => {
				toast.error(error.message || "Failed to update health update", {
					id: "update-health-update",
				});
			},
		}),
	);

	const isPending = isCreating || isUpdating;

	const handleSubmit = (values: z.infer<typeof schema>) => {
		if (defaultValues?.id) {
			updateHealthUpdate({
				id: defaultValues.id,
				health: values.health,
				summary: values.summary,
			});
		} else {
			createHealthUpdate({
				projectId,
				health: values.health,
				summary: values.summary,
			});
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="health"
					render={({ field }) => (
						<FormItem>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant={"secondary"}
										size="sm"
										type="button"
										className="w-fit"
									>
										<ProjectHealthIcon
											health={field.value}
											className="size-4"
										/>
										<ProjectHealthLabel health={field.value} />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									{healthOptions.map((option) => (
										<DropdownMenuItem
											key={option.value}
											onSelect={() => field.onChange(option.value)}
										>
											<ProjectHealthIcon
												health={option.value}
												className="mr-2 size-4"
											/>
											<ProjectHealthLabel health={option.value} />
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="summary"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Editor
									value={field.value || ""}
									onChange={field.onChange}
									ref={editorRef}
									className="[&_.tiptap]:min-h-[100px]"
									placeholder="Write a summary of the project's health..."
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="flex justify-end gap-2">
					<Button type="submit" disabled={isPending} size="sm">
						{isPending && <Loader />}
						{isEditing ? "Save Changes" : "Post Update"}
					</Button>
				</div>
			</form>
		</Form>
	);
};
