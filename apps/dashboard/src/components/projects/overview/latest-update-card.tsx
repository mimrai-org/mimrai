import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { Card, CardContent } from "@ui/components/ui/card";
import { Skeleton } from "@ui/components/ui/skeleton";
import { formatRelative } from "date-fns";
import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { AssigneeAvatar } from "@/components/asignee-avatar";
import { Response } from "@/components/chat/response";
import {
	ProjectHealthIcon,
	ProjectHealthLabel,
} from "@/components/forms/project-health-update-form/project-health-icon";
import { useUser } from "@/hooks/use-user";
import { trpc } from "@/utils/trpc";

export const LatestUpdate = ({
	projectId,
	className,
}: {
	projectId: string;
	className?: string;
}) => {
	const user = useUser();

	const { data: latest, isLoading } = useQuery(
		trpc.projectHealthUpdates.getLatest.queryOptions({
			projectId,
		}),
	);

	if (isLoading) {
		return <Skeleton className="h-[100px]" />;
	}

	if (!latest) {
		return (
			<div className={className}>
				<div className="flex items-center justify-center">
					<Link href={`${user?.basePath}/projects/${projectId}/updates`}>
						<Button variant="ghost" type="button">
							<ExternalLinkIcon />
							Write your first project update
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className={className}>
			<div className="group space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-sm">
						<ProjectHealthIcon health={latest?.health} className="size-4" />
						<ProjectHealthLabel health={latest?.health} />
					</div>
					<Link href={`${user?.basePath}/projects/${projectId}/updates`}>
						<Button type="button" size={"sm"} variant={"ghost"}>
							<ExternalLinkIcon />
							New Update
						</Button>
					</Link>
				</div>
				<div>
					<Response className="text-muted-foreground text-sm">
						{latest?.summary}
					</Response>
				</div>
				<div className="flex items-center gap-2 text-muted-foreground text-xs">
					{latest.createdBy && (
						<>
							<AssigneeAvatar
								name={latest.createdBy.name}
								image={latest.createdBy.image}
								className="size-4"
							/>
							<span>{latest.createdBy.name}</span>
							<span>•</span>
						</>
					)}
					{latest.createdAt && (
						<span>
							{formatRelative(new Date(latest.createdAt), new Date())}
						</span>
					)}
				</div>
			</div>
		</div>
	);
};
