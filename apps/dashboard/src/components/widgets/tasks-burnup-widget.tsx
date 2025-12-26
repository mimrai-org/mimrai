"use client";
import { UTCDate } from "@date-fns/utc";
import { Card, CardContent } from "@mimir/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@mimir/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@ui/components/ui/skeleton";
import { format, sub } from "date-fns";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { trpc } from "@/utils/trpc";

const chartConfig = {
	taskCompletedCount: {
		label: "Tasks Completed",
		color: "var(--chart-2)",
	},
	taskCreatedCount: {
		label: "Tasks Created",
		color: "var(--chart-4)",
	},
} satisfies ChartConfig;

export const TasksBurnupWidget = () => {
	const [dateRange, setDateRange] = useState<{
		startDate: Date;
		endDate: Date;
	}>({
		startDate: sub(new UTCDate(), { days: 7 }),
		endDate: new UTCDate(),
	});

	const { data, isLoading } = useQuery(
		trpc.widgets.tasksBurnup.queryOptions({
			...dateRange,
		}),
	);

	return (
		<Card className="h-full">
			<CardContent>
				<ChartContainer config={chartConfig} className="aspect-auto h-[200px]">
					<AreaChart accessibilityLayer data={data}>
						<CartesianGrid vertical={false} strokeDasharray="3 3" />
						<XAxis
							dataKey="date"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickFormatter={(value) => format(new UTCDate(value), "MMM dd")}
						/>
						<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
						<defs>
							<linearGradient
								id="gradient-rounded-chart-completed"
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop
									offset="5%"
									stopColor="var(--color-chart-2)"
									stopOpacity={0.5}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-chart-2)"
									stopOpacity={0.1}
								/>
							</linearGradient>
							<linearGradient
								id="gradient-rounded-chart-created"
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop
									offset="5%"
									stopColor="var(--color-chart-1)"
									stopOpacity={0.5}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-chart-1)"
									stopOpacity={0.1}
								/>
							</linearGradient>
						</defs>
						<Area
							dataKey="taskCreatedCount"
							type="monotone"
							fill="url(#gradient-rounded-chart-created)"
							fillOpacity={0.4}
							stroke="var(--color-chart-1)"
							stackId="a"
							strokeWidth={0.8}
							strokeDasharray={"3 3"}
						/>
						<Area
							dataKey="taskCompletedCount"
							type="monotone"
							fill="url(#gradient-rounded-chart-completed)"
							fillOpacity={0.4}
							stroke="var(--color-chart-2)"
							stackId="a"
							strokeWidth={0.8}
							strokeDasharray={"3 3"}
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
};
