import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { Form } from "@ui/components/ui/form";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Loader from "@/components/loader";
import { useProjectParams } from "@/hooks/use-project-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { queryClient, trpc } from "@/utils/trpc";
import { ProjectColorPicker } from "./color-picker";
import { Description } from "./description";
import { type ProjectFormValues, projectFormSchema } from "./form-type";
import { TasksList } from "./tasks-list";
import { Name } from "./title";

export const ProjectForm = ({
	defaultValues,
}: {
	defaultValues?: Partial<ProjectFormValues>;
}) => {
	const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
		defaultValues?.updatedAt ? new Date(defaultValues.updatedAt) : null,
	);
	const { setParams } = useProjectParams();
	const form = useZodForm(projectFormSchema, {
		defaultValues: {
			name: "",
			description: "",
			color: "#ffffff",
			...defaultValues,
		},
	});

	const { mutate: updateProject, isPending: isUpdating } = useMutation(
		trpc.projects.update.mutationOptions({
			onMutate: () => {
				toast.loading("Updating project...", { id: "update-project" });
			},
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.projects.get.infiniteQueryOptions());
				toast.success("Project updated successfully", { id: "update-project" });
			},
			onError: (error) => {
				toast.error("Failed to update project", { id: "update-project" });
			},
		}),
	);

	const { mutate: createProject, isPending: isCreating } = useMutation(
		trpc.projects.create.mutationOptions({
			onMutate: () => {
				toast.loading("Creating project...", { id: "create-project" });
			},
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.projects.get.infiniteQueryOptions());
				toast.success("Project created successfully", { id: "create-project" });
				setParams(null);
			},
			onError: (error) => {
				toast.error("Failed to create project", { id: "create-project" });
			},
		}),
	);

	const handleSubmit = (values: ProjectFormValues) => {
		if (defaultValues?.id) {
			updateProject({
				...values,
				id: defaultValues.id,
			});
		} else {
			createProject(values);
		}
	};

	useEffect(() => {
		return () => {
			const { isDirty, isValid } = form.formState;
			if (isValid && isDirty) {
				const values = form.getValues();
				if (!values.id) return;

				// Auto save
				updateProject({
					...values,
					id: values.id,
				});
			}
		};
	}, []);

	return (
		<div className="space-y-4">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)}>
					<div className="space-y-4 pt-4">
						<ProjectColorPicker />
						<Name />
						<Description />

						<hr />
						<div className="flex justify-end">
							<div className="flex items-center gap-4">
								<span className="text-muted-foreground text-xs">
									Last saved at {lastSavedAt?.toLocaleString()}
								</span>
								<Button
									type="submit"
									variant={"default"}
									size={"sm"}
									disabled={isCreating || isUpdating}
								>
									{(isCreating || isUpdating) && <Loader />}
									{defaultValues?.id ? "Save" : "Create"}
								</Button>
							</div>
						</div>
					</div>
				</form>
			</Form>
			{defaultValues?.id && (
				<>
					<hr />
					<TasksList projectId={defaultValues.id} />
				</>
			)}
		</div>
	);
};
