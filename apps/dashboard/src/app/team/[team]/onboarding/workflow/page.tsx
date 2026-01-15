"use client";

import type { RouterOutputs } from "@mimir/trpc";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@ui/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/ui/select";
import { Textarea } from "@ui/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@ui/components/ui/tooltip";
import { ChevronRight, InfoIcon, PencilIcon, SkipForward } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import Loader from "@/components/loader";
import { useUser } from "@/components/user-provider";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/utils/trpc";
import { WorkflowSuggested } from "./workflow-suggested";

export type WorkflowSuggestedType =
	RouterOutputs["onboarding"]["generateWorkflow"];

const schema = z.object({
	whatYourTeamDoes: z.string().min(5, "Please provide more details."),
	currentTool: z.string(),
	howIsYourWorkflow: z
		.string()
		.min(5, "Please provide more details.")
		.optional(),
});

const toolsList = [
	"Asana",
	"Trello",
	"Jira",
	"ClickUp",
	"Monday.com",
	"Notion",
	"Linear",
	"Microsoft Planner",
	"Other",
];

export default function Page() {
	const router = useRouter();
	const user = useUser({
		refetchOnMount: true,
	});
	const form = useZodForm(schema, {
		defaultValues: {
			whatYourTeamDoes: "",
			currentTool: "",
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
				router.push(`/team/${user?.team?.slug}/onboarding`);
			},
			onError: (error) => {
				toast.error("Failed to confirm workflow. Please try again.");
			},
		}),
	);

	const { mutate: skipWorkflowSetup, isPending: isSkipping } = useMutation(
		trpc.onboarding.defaultWorkflow.mutationOptions({
			onSuccess: () => {
				router.push(`/team/${user?.team?.slug}/board`);
			},
			onError: (error) => {
				toast.error("Failed to skip workflow setup. Please try again.");
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
		<div className="mx-auto my-auto h-fit max-w-3xl justify-center overflow-y-auto p-8">
			<div className="mb-8 space-y-1">
				<h1 className="font-header text-4xl">Let's build your workflow</h1>
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
								name="currentTool"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											What tool are you currently using for project management?
										</FormLabel>
										<FormControl>
											<Select>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select a tool" />
												</SelectTrigger>
												<SelectContent>
													{toolsList.map((tool) => (
														<SelectItem
															key={tool}
															value={tool}
															onSelect={() => field.onChange(tool)}
														>
															{tool}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="howIsYourWorkflow"
								render={({ field }) => (
									<FormItem>
										<FormLabel>How is your workflow? if any</FormLabel>
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
						<Button type="submit" disabled={isLoading || isSkipping}>
							{isLoading ? <Loader /> : "Continue"}
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
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									variant={"ghost"}
									disabled={isSkipping || isLoading}
									onClick={() => skipWorkflowSetup()}
								>
									{isSkipping ? <Loader /> : <SkipForward />}
									Skip
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								We will set up a basic workflow for you, and you can customize
								it later.
							</TooltipContent>
						</Tooltip>
					</div>
				</form>
			</Form>
		</div>
	);
}
