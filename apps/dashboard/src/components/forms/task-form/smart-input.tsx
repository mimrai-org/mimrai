import { Button } from "@mimir/ui/button";
import { Textarea } from "@mimir/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@ui/components/ui/tooltip";
import { CheckIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useDebounceCallback, useDebounceValue } from "usehooks-ts";
import Loader from "@/components/loader";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { TaskDuplicated } from "./duplicated";
import type { TaskFormValues } from "./form-type";
import { TaskFormProperties } from "./properties";

export const SmartInput = () => {
	const form = useFormContext<TaskFormValues>();
	const [explanation, setExplanation] = useState("");
	const [value, setValue] = useState("");
	const lastCompletedValue = useRef("");

	const inputRef = useRef<HTMLTextAreaElement>(null);
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
						showSmartInput: true,
						...data,
					},
					{
						keepValues: false,
						keepDirty: true,
					},
				);
			},
		}),
	);

	const debouncedMutate = useDebounceCallback(mutate, 1400);

	useEffect(() => {
		// check if the length of the value is not too long to used it as title
		if (value.length <= 20) {
			form.setValue("title", value);
		}

		// compare last completed value to debounced value to determine if there is sufficient new context to trigger a new completion
		const nonWhitespaceCharacters = value.replace(/\s/g, "");
		const lastCharactersDifference = Math.abs(
			nonWhitespaceCharacters.length - lastCompletedValue.current.length,
		);

		if (lastCharactersDifference >= 3) {
			lastCompletedValue.current = nonWhitespaceCharacters;
			debouncedMutate({ prompt: value });
		}
	}, [value]);
	const title = form.watch("title");

	const handleCancel = () => {
		form.setValue("showSmartInput", false);
	};

	return (
		<div>
			<Textarea
				ref={inputRef}
				className={cn(
					"border-0 bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent",
					"px-0 text-base placeholder:text-base md:text-lg",
				)}
				placeholder="Describe what you want to do..."
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
						e.preventDefault();
						// look for the submit button and click it
						const formElement = e.currentTarget.form;
						if (!formElement) return;
						const submitButton = formElement.querySelector(
							'button[type="submit"]',
						) as HTMLButtonElement;
						if (submitButton) {
							submitButton.click();
						}
					}
				}}
			/>
			<div className="flex justify-between">
				<div>
					<TaskDuplicated title={value} />
					<div className={cn("opacity-50")}>
						{(title || value) && (
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="flex w-fit items-center gap-2 text-sm">
										{isPending ? (
											<Loader className="size-4" />
										) : (
											<SparklesIcon className="size-4" />
										)}
										{title || value}
									</div>
								</TooltipTrigger>
								<TooltipContent className="max-w-lg">
									<span>{explanation}</span>
								</TooltipContent>
							</Tooltip>
						)}
						<TaskFormProperties />
					</div>
				</div>
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
					<Button type="submit" size={"sm"} className="size-8">
						<CheckIcon />
					</Button>
				</div>
			</div>
		</div>
	);
};
