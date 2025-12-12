"use client";

import type { RouterOutputs } from "@api/trpc/routers";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@ui/components/ui/form";
import { Textarea } from "@ui/components/ui/textarea";
import { ChevronRight, PencilIcon, SkipForward } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/utils/trpc";
import { WorkflowSuggested } from "./workflow-suggested";

export type WorkflowSuggestedType =
	RouterOutputs["onboarding"]["generateWorkflow"];

const schema = z.object({
	whatYourTeamDoes: z.string().min(5, "Please provide more details."),
	howIsYourWorkflow: z.string().min(5, "Please provide more details."),
});

export default function Page() {
	const router = useRouter();
	const form = useZodForm(schema, {
		defaultValues: {
			whatYourTeamDoes: "",
			howIsYourWorkflow: "",
		},
	});
	const [workflowSuggested, setWorkflowSuggested] =
		useState<WorkflowSuggestedType | null>(null);

	const { mutate: generateWorkflow, isPending } = useMutation(
		trpc.onboarding.generateWorkflow.mutationOptions({
			onSuccess: (data) => {
				setWorkflowSuggested(data);
			},
			onError: (error) => {
				setWorkflowSuggested(null);
				toast.error("Failed to generate workflow. Please try again.");
			},
		}),
	);

	const { mutate: confirmWorkflow, isPending: isConfirming } = useMutation(
		trpc.onboarding.confirmWorkflow.mutationOptions({
			onSuccess: () => {
				router.push("/dashboard/onboarding");
			},
			onError: (error) => {
				toast.error("Failed to confirm workflow. Please try again.");
			},
		}),
	);

	const handleSubmit = (data: z.infer<typeof schema>) => {
		if (!workflowSuggested) {
			generateWorkflow(data);
			return;
		}

		confirmWorkflow({ workflowSuggestion: workflowSuggested });
	};

	const isLoading = isPending || isConfirming;

	return (
		<div className="mx-auto my-auto h-fit max-w-3xl justify-center gap-4 overflow-y-auto p-8">
			<div className="mb-4 space-y-1">
				<h1 className="text-4xl">Let's build your workflow</h1>
				<p className="text-muted-foreground">
					To help you get started, we can suggest a workflow based on your team
					information.
				</p>
			</div>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
					{workflowSuggested && (
						<WorkflowSuggested
							workflowSuggested={workflowSuggested}
							onChange={setWorkflowSuggested}
						/>
					)}
					{!workflowSuggested && (
						<>
							<FormField
								control={form.control}
								name="whatYourTeamDoes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>What does your team do?</FormLabel>
										<FormControl>
											<Textarea
												{...field}
												placeholder="Describe your team's purpose and activities."
											/>
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="howIsYourWorkflow"
								render={({ field }) => (
									<FormItem>
										<FormLabel>How is your workflow?</FormLabel>
										<FormControl>
											<Textarea
												{...field}
												placeholder="Describe your team's workflow."
											/>
										</FormControl>
									</FormItem>
								)}
							/>
						</>
					)}
					<div className="mt-4 flex justify-start gap-2">
						<Button type="submit" disabled={isLoading}>
							{isLoading ? "Generating..." : "Continue"}
							<ChevronRight />
						</Button>
						{workflowSuggested && (
							<Button
								variant={"ghost"}
								type="button"
								onClick={() => setWorkflowSuggested(null)}
							>
								<PencilIcon />
								Change information
							</Button>
						)}
						<Link href="/dashboard/onboarding">
							<Button type="button" variant={"ghost"}>
								<SkipForward />
								Skip for now
							</Button>
						</Link>
					</div>
				</form>
			</Form>
		</div>
	);
}
