import type { RouterOutputs } from "@api/trpc/routers";
import { Button } from "@mimir/ui/button";
import { Textarea } from "@mimir/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { TaskDuplicated } from "./task-duplicated";

export const SmartInput = ({
	onFinish,
}: {
	onFinish: (data: RouterOutputs["tasks"]["smartComplete"]) => void;
}) => {
	const [value, setValue] = useState("");
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const { mutate, isPending } = useMutation(
		trpc.tasks.smartComplete.mutationOptions({
			onSuccess: (data) => {
				onFinish(data);
			},
		}),
	);

	const handleSubmit = () => {
		const prompt = inputRef.current?.value;
		console.log("Prompt:", prompt);
		if (prompt && prompt.trim().length > 0) {
			mutate({ prompt });
		}
	};

	const handleCancel = () => {
		onFinish({ title: "" });
	};

	return (
		<div>
			<Textarea
				ref={inputRef}
				className={cn(
					"border-0 bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent",
					"text-base placeholder:text-lg md:text-lg",
				)}
				placeholder="Describe what you want to do..."
				value={value}
				onChange={(e) => setValue(e.target.value)}
				disabled={isPending}
				onKeyDown={(e) => {
					if (e.key === "Enter" && !e.shiftKey) {
						e.preventDefault();
						handleSubmit();
					}
				}}
			/>
			<div className="flex justify-between">
				<div>
					<TaskDuplicated title={value} />
				</div>
				<div className="flex items-center space-x-2">
					<Button
						type="button"
						size={"sm"}
						variant={"ghost"}
						onClick={handleCancel}
						disabled={isPending}
					>
						use form
					</Button>
					<Button
						type="button"
						size={"sm"}
						disabled={isPending}
						onClick={handleSubmit}
					>
						{isPending ? (
							<>
								<Loader2Icon className="mr-2 size-4 animate-spin" />
								Generating...
							</>
						) : (
							<ArrowUpIcon />
						)}
					</Button>
				</div>
			</div>
		</div>
	);
};
