"use client";

import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/ui/card";
import { Input } from "@ui/components/ui/input";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { trpc } from "@/utils/trpc";

export const TeamDelete = () => {
	const user = useUser();
	const [teamName, setTeamName] = useState("");

	const { mutate, isPending } = useMutation(
		trpc.teams.deleteTeam.mutationOptions({
			onSuccess: () => {
				window.location.reload();
			},
		}),
	);

	const isValid = useMemo(() => {
		return teamName === user?.team?.name;
	}, [teamName, user?.team?.name]);

	const handleSubmit = () => {
		if (!isValid) return;
		mutate();
	};

	return (
		<Card className="border-destructive/50">
			<CardHeader>
				<CardTitle className="text-destructive">Delete Team</CardTitle>
				<CardDescription>This action cannot be undone. </CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<div className="space-y-1">
						<Input
							placeholder="Type team name to confirm"
							value={teamName}
							onChange={(e) => setTeamName(e.target.value)}
						/>
						<span className="text-muted-foreground text-xs">
							Type{" "}
							<span className="border px-1 py-0.5 text-foreground">
								{user?.team?.name}
							</span>{" "}
							to confirm.
						</span>
					</div>
					<div className="flex justify-end">
						<Button
							type="button"
							variant="destructive"
							disabled={!isValid || isPending}
							onClick={handleSubmit}
						>
							{isPending && <Loader2 className="animate-spin" />}
							Delete Team
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
