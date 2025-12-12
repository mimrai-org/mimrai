import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/ui/collapsible";
import { LabelBadge } from "@ui/components/ui/label-badge";
import { ChevronsUpDownIcon, XIcon } from "lucide-react";
import { StatusIcon } from "@/components/status-icon";
import type { WorkflowSuggestedType } from "./page";

export const WorkflowSuggested = ({
	workflowSuggested,
	onChange,
}: {
	workflowSuggested: WorkflowSuggestedType;
	onChange: (newValue: WorkflowSuggestedType) => void;
}) => {
	const handleRemoveStatus = (statusName: string) => {
		const updatedStatuses = workflowSuggested.statuses.filter(
			(status) => status.name !== statusName,
		);
		onChange({ ...workflowSuggested, statuses: updatedStatuses });
	};

	const handleRemoveLabel = (labelName: string) => {
		const updatedLabels = workflowSuggested.labels.filter(
			(label) => label.name !== labelName,
		);
		onChange({ ...workflowSuggested, labels: updatedLabels });
	};

	return (
		<div>
			<div className="space-y-2">
				<div>
					<h2 className="font-medium text-lg">Suggested Workflow</h2>
					<p className="text-muted-foreground text-sm">
						Below are the suggested workflow for your team based on the
						information you provided.
					</p>
				</div>
				<div>
					{workflowSuggested.workflow.map((step, index) => (
						<div
							key={index}
							className="flex items-start gap-3 border-l px-3 py-2"
						>
							<span className="font-medium text-muted-foreground text-sm">
								{index + 1}.
							</span>
							<p className="text-sm">{step.description}</p>
						</div>
					))}
				</div>
			</div>

			<div className="mt-4">
				<Collapsible>
					<CollapsibleTrigger className="mb-2 flex w-full items-center gap-2 text-sm">
						<ChevronsUpDownIcon className="size-4" />
						Suggested Statuses
					</CollapsibleTrigger>
					<CollapsibleContent className="space-y-2">
						{workflowSuggested.statuses.map((status) => (
							<div
								key={status.name}
								className="flex items-center rounded border p-3"
							>
								<div>
									<h2 className="mb-1 font-medium text-sm">
										<StatusIcon
											{...status}
											className="mr-1 inline-block size-3.5"
										/>
										{status.name}
									</h2>
									<p className="text-muted-foreground text-xs">
										{status.description}
									</p>
								</div>
								<button
									type="button"
									title="Remove status"
									className="ml-auto text-muted-foreground transition-colors hover:text-red-600"
									onClick={() => handleRemoveStatus(status.name)}
								>
									<XIcon className="size-4" />
								</button>
							</div>
						))}
					</CollapsibleContent>
				</Collapsible>
			</div>
			<div className="mt-4">
				<Collapsible>
					<CollapsibleTrigger className="mb-2 flex w-full items-center gap-2 text-sm">
						<ChevronsUpDownIcon className="size-4" />
						Suggested Labels
					</CollapsibleTrigger>
					<CollapsibleContent className="space-y-2">
						{workflowSuggested.labels.map((label) => (
							<div
								key={label.name}
								className="flex items-center rounded border p-3"
							>
								<div>
									<h2 className="mb-1 font-medium text-sm">
										<LabelBadge name={label.name} color={label.color} />
									</h2>
									<p className="text-muted-foreground text-xs">
										{label.description}
									</p>
								</div>
								<button
									type="button"
									title="Remove label"
									className="ml-auto text-muted-foreground transition-colors hover:text-red-600"
									onClick={() => handleRemoveLabel(label.name)}
								>
									<XIcon className="size-4" />
								</button>
							</div>
						))}
					</CollapsibleContent>
				</Collapsible>
			</div>

			<div>
				<h3 className="mt-4 mb-2 font-medium text-lg">
					Additional Recommendations
				</h3>
				<p className="text-muted-foreground text-sm">
					{workflowSuggested.additionalRecommendations}
				</p>
			</div>
		</div>
	);
};
