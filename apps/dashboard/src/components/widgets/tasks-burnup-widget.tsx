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
import { format, sub } from "date-fns";
import { useState } from "react";
import { Area, AreaChart, XAxis } from "recharts";
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

	const { data } = useQuery(
		trpc.widgets.tasksBurnup.queryOptions({
			...dateRange,
		}),
	);

	return (
		<Card className="h-full">
			<CardContent>
				<ChartContainer
					config={chartConfig}
					className="aspect-auto h-[200px] w-full"
				>
					<AreaChart accessibilityLayer data={data || []}>
						<XAxis
							dataKey={"date"}
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickFormatter={(value) => format(new UTCDate(value), "MMM dd")}
						/>
						<defs>
							<linearGradient
								id="fillTaskCompletedCount"
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop
									offset="5%"
									stopColor="var(--chart-1)"
									stopOpacity={0.8}
								/>
								<stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
							</linearGradient>
							<linearGradient
								id="fillTaskCreatedCount"
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop
									offset="5%"
									stopColor="var(--chart-2)"
									stopOpacity={0.8}
								/>
								<stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
							</linearGradient>
						</defs>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
						/>
						<Area
							dataKey={"taskCompletedCount"}
							type={"monotone"}
							fill="url(#fillTaskCompletedCount)"
							stroke="var(--chart-1)"
							stackId={"a"}
						/>
						<Area
							dataKey={"taskCreatedCount"}
							type={"monotone"}
							fill="url(#fillTaskCreatedCount)"
							stroke="var(--chart-2)"
							stackId={"b"}
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
};
