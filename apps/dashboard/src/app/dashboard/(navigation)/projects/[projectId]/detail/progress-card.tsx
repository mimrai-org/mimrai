import { useQuery } from "@tanstack/react-query";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@ui/components/ui/card";
import { AssigneeAvatar } from "@/components/kanban/asignee-avatar";
import { trpc } from "@/utils/trpc";
import { Progress } from "../../projects-list";

export const ProjectProgressCard = ({ projectId }: { projectId: string }) => {
	const { data } = useQuery(
		trpc.projects.getProgress.queryOptions({ id: projectId }),
	);

	return (
		<Card>
			<CardHeader>
				<div className="flex justify-between">
					<CardDescription>Overall Project Progress</CardDescription>
				</div>
				<div className="flex justify-start gap-2 text-xs">
					<div className="flex gap-2 rounded-xs py-0.5">
						<span className="text-muted-foreground">Total</span>
						<span>
							{(data?.overall?.inProgress ?? 0) +
								(data?.overall?.completed ?? 0)}
						</span>
					</div>
					<div className="flex gap-2 rounded-xs py-0.5">
						<span className="text-muted-foreground">Completed</span>
						<span>{data?.overall?.completed ?? 0}</span>
					</div>
				</div>
				<div>
					<Progress
						completed={data?.overall?.completed ?? 0}
						inProgress={data?.overall?.inProgress ?? 0}
					/>
				</div>
			</CardHeader>
			<CardContent>
				<ul className="mt-4 space-y-2">
					{data?.members.map((member) => (
						<li key={member.id} className="flex items-center gap-4">
							<AssigneeAvatar {...member} />
							<Progress
								completed={member.progress.completed}
								inProgress={member.progress.inProgress}
								color={member.color}
							/>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
};
