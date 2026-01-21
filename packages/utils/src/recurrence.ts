export const getNextTaskRecurrenceDate = ({
	currentDate,
	frequency,
	interval,
}: {
	currentDate: Date;
	frequency: "daily" | "weekly" | "monthly" | "yearly";
	interval: number;
}): Date => {
	const current = currentDate;
	const nextDate = new Date(current);
	switch (frequency) {
		case "daily":
			nextDate.setDate(nextDate.getDate() + interval);
			break;
		case "weekly":
			nextDate.setDate(nextDate.getDate() + interval * 7);
			break;
		case "monthly":
			nextDate.setMonth(nextDate.getMonth() + interval);
			break;
		case "yearly":
			nextDate.setFullYear(nextDate.getFullYear() + interval);
			break;
	}
	return nextDate;
};
