import { Button } from "@mimir/ui/button";
import { useMutation } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Editor } from "@/components/editor";
import Loader from "@/components/loader";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import type { TaskFormValues } from "./form-type";

export const SmartInput = () => {
	const form = useFormContext<TaskFormValues>();
	const [value, setValue] = useState("");
	const [explanation, setExplanation] = useState<string | null>(null);

	const { mutate, isPending } = useMutation(
		trpc.tasks.smartComplete.mutationOptions({
			onSuccess: (data) => {
				setExplanation(data.explanation);

				// clean up empty properties
				if (data) {
					for (const key in data) {
						if (
							(data as any)[key] === null ||
							(data as any)[key] === "" ||
							(Array.isArray((data as any)[key]) &&
								(data as any)[key].length === 0)
						) {
							delete (data as any)[key];
						}
					}
				}

				form.reset(
					{
						...data,
						showSmartInput: false,
						description: value,
						title: data.title,
					},
					{
						keepDefaultValues: true,
						keepValues: false,
						keepErrors: false,
						keepDirty: true,
					},
				);
			},
		}),
	);

	const handleCancel = () => {
		form.setValue("showSmartInput", false);
	};

	const handleSubmit = async () => {
		mutate({
			prompt: value,
		});
	};

	return (
		<div className="mt-4">
			<Editor
				className={cn(
					"border-0 bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent",
					"px-0 pt-2 [&_.tiptap]:min-h-18 [&_.tiptap]:text-base!",
				)}
				placeholder="Describe what you want to do..."
				value={value}
				onChange={(value) => setValue(value)}
			/>
			<div className="mt-4 flex justify-end">
				<div className="flex items-end space-x-2">
					<Button
						type="button"
						size={"sm"}
						variant={"ghost"}
						onClick={handleCancel}
						className="text-muted-foreground"
						disabled={isPending}
					>
						use form
					</Button>
					<Button
						type="button"
						onClick={handleSubmit}
						size={"sm"}
						disabled={value.trim() === "" || isPending}
					>
						{isPending ? <Loader /> : <CheckIcon />}
						Confirm
					</Button>
				</div>
			</div>
		</div>
	);
};
