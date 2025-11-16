import { getAppUrl } from "@mimir/utils/envs";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@ui/components/ui/form";
import { Input } from "@ui/components/ui/input";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import z from "zod";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/utils/trpc";

const schema = z.object({
	email: z.string().email("Please enter a valid email address."),
});

export const WaitlistForm = () => {
	const form = useZodForm(schema, {
		defaultValues: {
			email: "",
		},
	});

	const {
		mutate: joinWaitlist,
		isPending: isJoining,
		data: waitlistData,
	} = useMutation(
		trpc.waitlist.join.mutationOptions({
			onMutate: () => {
				toast.loading("Joining waitlist...", {
					id: "waitlist",
					position: "top-center",
				});
			},
			onSettled: (error) => {
				toast.success("Thank you for joining the waitlist!", {
					id: "waitlist",
				});
			},
		}),
	);

	const handleSubmit = (data: z.infer<typeof schema>) => {
		joinWaitlist(data);
	};

	if (waitlistData) {
		return (
			<div>
				<h2 className="font-runic text-lg">
					Thank you for joining the waitlist!
				</h2>
				<p className="text-muted-foreground text-sm">
					We will notify you via email when we launch.
				</p>
				{/* <Button variant={"outline"}>Provide Feedback</Button> */}
			</div>
		);
	}

	return (
		<div>
			<h2 className="font-runic text-lg">For small teams and fast workflows</h2>
			<p className="mb-4 text-muted-foreground text-sm">
				Join the waitlist to be among the first to try MIMRAI.
			</p>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-2">
					<FormField
						name="email"
						control={form.control}
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input
										{...field}
										placeholder="jhondoe@example.com"
										type="email"
									/>
								</FormControl>
							</FormItem>
						)}
					/>

					<div className="flex justify-end space-x-2">
						<Link href={`${getAppUrl()}/sign-in`}>
							<Button type="button" variant={"ghost"}>
								Sign in
							</Button>
						</Link>
						<Button disabled={isJoining}>Join Waitlist</Button>
					</div>
				</form>
			</Form>
		</div>
	);
};
