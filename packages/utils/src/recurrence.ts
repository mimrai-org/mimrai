import { Cron, CronPattern } from "croner";

const MINUTE_MAX = 59;
const HOUR_MAX = 23;
const DAY_OF_MONTH_MAX = 31;
const MONTH_MAX = 12;

export type TaskRecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface TaskRecurrenceEditorValue {
	frequency: TaskRecurrenceFrequency;
	interval: number;
	startDate?: string;
}

const isTaskRecurrenceFrequency = (
	value: unknown,
): value is TaskRecurrenceFrequency => {
	return (
		value === "daily" ||
		value === "weekly" ||
		value === "monthly" ||
		value === "yearly"
	);
};

const addRecurrenceInterval = ({
	currentDate,
	frequency,
	interval,
}: {
	currentDate: Date;
	frequency: TaskRecurrenceFrequency;
	interval: number;
}): Date => {
	const nextDate = new Date(currentDate);

	switch (frequency) {
		case "daily":
			nextDate.setUTCDate(nextDate.getUTCDate() + interval);
			break;
		case "weekly":
			nextDate.setUTCDate(nextDate.getUTCDate() + interval * 7);
			break;
		case "monthly":
			nextDate.setUTCMonth(nextDate.getUTCMonth() + interval);
			break;
		case "yearly":
			nextDate.setUTCFullYear(nextDate.getUTCFullYear() + interval);
			break;
	}

	return nextDate;
};

const parseNumber = (value: string): number | null => {
	const parsed = Number(value);
	if (!Number.isInteger(parsed)) {
		return null;
	}
	return parsed;
};

const parseCron = (
	cronExpression: string,
): {
	minute: number;
	hour: number;
	frequency: TaskRecurrenceFrequency;
	interval: number;
	dayOfMonth?: number;
	month?: number;
	dayOfWeek?: number;
} | null => {
	const parts = cronExpression.trim().split(/\s+/);
	if (parts.length !== 5) {
		return null;
	}

	const [minutePart, hourPart, dayOfMonth, month, dayOfWeek] = parts as [
		string,
		string,
		string,
		string,
		string,
	];

	const minute = parseNumber(minutePart);
	const hour = parseNumber(hourPart);

	if (minute === null || minute < 0 || minute > MINUTE_MAX) {
		return null;
	}

	if (hour === null || hour < 0 || hour > HOUR_MAX) {
		return null;
	}

	const dailyMatch = /^\*\/(\d+)$/.exec(dayOfMonth);
	if (dailyMatch && month === "*" && dayOfWeek === "*") {
		const dailyInterval = dailyMatch[1];
		if (!dailyInterval) {
			return null;
		}
		const interval = parseNumber(dailyInterval);
		if (interval === null || interval < 1) {
			return null;
		}
		return { minute, hour, frequency: "daily", interval };
	}

	if (dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
		return { minute, hour, frequency: "daily", interval: 1 };
	}

	const weeklyDayOfWeek = parseNumber(dayOfWeek);
	if (dayOfMonth === "*" && month === "*" && weeklyDayOfWeek !== null) {
		if (weeklyDayOfWeek < 0 || weeklyDayOfWeek > 6) {
			return null;
		}
		return {
			minute,
			hour,
			frequency: "weekly",
			interval: 1,
			dayOfWeek: weeklyDayOfWeek,
		};
	}

	const monthlyDay = parseNumber(dayOfMonth);
	const monthlyIntervalMatch = /^\*\/(\d+)$/.exec(month);
	if (
		monthlyDay !== null &&
		monthlyIntervalMatch &&
		dayOfWeek === "*" &&
		monthlyDay >= 1 &&
		monthlyDay <= DAY_OF_MONTH_MAX
	) {
		const monthlyInterval = monthlyIntervalMatch[1];
		if (!monthlyInterval) {
			return null;
		}
		const interval = parseNumber(monthlyInterval);
		if (interval === null || interval < 1) {
			return null;
		}
		return {
			minute,
			hour,
			frequency: "monthly",
			interval,
			dayOfMonth: monthlyDay,
		};
	}

	const yearlyMonth = parseNumber(month);
	if (
		monthlyDay !== null &&
		yearlyMonth !== null &&
		dayOfWeek === "*" &&
		monthlyDay >= 1 &&
		monthlyDay <= DAY_OF_MONTH_MAX &&
		yearlyMonth >= 1 &&
		yearlyMonth <= MONTH_MAX
	) {
		return {
			minute,
			hour,
			frequency: "yearly",
			interval: 1,
			dayOfMonth: monthlyDay,
			month: yearlyMonth,
		};
	}

	return null;
};

const parseLegacyRecurrence = (
	value: string,
): TaskRecurrenceEditorValue | null => {
	try {
		const parsed = JSON.parse(value) as {
			frequency?: unknown;
			interval?: unknown;
			startDate?: unknown;
		};

		if (!isTaskRecurrenceFrequency(parsed.frequency)) {
			return null;
		}

		const interval =
			typeof parsed.interval === "number"
				? parsed.interval
				: Number(parsed.interval);

		if (!Number.isInteger(interval) || interval < 1) {
			return null;
		}

		return {
			frequency: parsed.frequency,
			interval,
			startDate:
				typeof parsed.startDate === "string" ? parsed.startDate : undefined,
		};
	} catch {
		return null;
	}
};

const getValidStartDate = (startDate?: string): Date => {
	if (!startDate) {
		return new Date();
	}

	const parsedDate = new Date(startDate);
	if (Number.isNaN(parsedDate.getTime())) {
		return new Date();
	}

	return parsedDate;
};

const getNextDateForDayOfWeek = ({
	referenceDate,
	targetDayOfWeek,
}: {
	referenceDate: Date;
	targetDayOfWeek: number;
}) => {
	const date = new Date(referenceDate);
	const currentDay = date.getUTCDay();
	const delta = (targetDayOfWeek - currentDay + 7) % 7;
	date.setUTCDate(date.getUTCDate() + delta);
	return date;
};

const isValidCronExpression = (cronExpression: string): boolean => {
	try {
		new CronPattern(cronExpression, "UTC");
		return true;
	} catch {
		return false;
	}
};

const getNextCronRun = ({
	currentDate,
	cronExpression,
}: {
	currentDate: Date;
	cronExpression: string;
}): Date | null => {
	let cronJob: Cron | null = null;

	try {
		cronJob = new Cron(cronExpression, {
			paused: true,
			timezone: "UTC",
		});
		return cronJob.nextRun(currentDate);
	} catch {
		return null;
	} finally {
		cronJob?.stop();
	}
};

const getNextLegacyRecurrenceDate = ({
	currentDate,
	recurrence,
}: {
	currentDate: Date;
	recurrence: TaskRecurrenceEditorValue;
}): Date => {
	let candidate = getValidStartDate(recurrence.startDate);

	while (candidate <= currentDate) {
		candidate = addRecurrenceInterval({
			currentDate: candidate,
			frequency: recurrence.frequency,
			interval: recurrence.interval,
		});
	}

	return candidate;
};

export const recurrenceEditorToCron = (
	recurrence: TaskRecurrenceEditorValue,
): string => {
	const startDate = getValidStartDate(recurrence.startDate);
	const minute = startDate.getUTCMinutes();
	const hour = startDate.getUTCHours();
	const dayOfMonth = startDate.getUTCDate();
	const month = startDate.getUTCMonth() + 1;
	const dayOfWeek = startDate.getUTCDay();

	switch (recurrence.frequency) {
		case "daily":
			return `${minute} ${hour} */${recurrence.interval} * *`;
		case "weekly":
			return `${minute} ${hour} * * ${dayOfWeek}`;
		case "monthly":
			return `${minute} ${hour} ${dayOfMonth} */${recurrence.interval} *`;
		case "yearly":
			return `${minute} ${hour} ${dayOfMonth} ${month} *`;
	}
};

export const cronToRecurrenceEditor = (
	cronExpression: string,
	referenceDateInput?: Date,
): TaskRecurrenceEditorValue | null => {
	const parsed = parseCron(cronExpression);
	if (!parsed) {
		return parseLegacyRecurrence(cronExpression);
	}

	const referenceDate = referenceDateInput
		? new Date(referenceDateInput)
		: new Date();
	referenceDate.setUTCSeconds(0, 0);
	referenceDate.setUTCHours(parsed.hour, parsed.minute, 0, 0);

	switch (parsed.frequency) {
		case "daily":
			return {
				frequency: "daily",
				interval: parsed.interval,
				startDate: referenceDate.toISOString(),
			};
		case "weekly": {
			const startDate = getNextDateForDayOfWeek({
				referenceDate,
				targetDayOfWeek: parsed.dayOfWeek ?? 0,
			});
			return {
				frequency: "weekly",
				interval: 1,
				startDate: startDate.toISOString(),
			};
		}
		case "monthly": {
			const startDate = new Date(referenceDate);
			startDate.setUTCDate(parsed.dayOfMonth ?? referenceDate.getUTCDate());
			return {
				frequency: "monthly",
				interval: parsed.interval,
				startDate: startDate.toISOString(),
			};
		}
		case "yearly": {
			const startDate = new Date(referenceDate);
			startDate.setUTCMonth((parsed.month ?? 1) - 1);
			startDate.setUTCDate(parsed.dayOfMonth ?? 1);
			return {
				frequency: "yearly",
				interval: 1,
				startDate: startDate.toISOString(),
			};
		}
	}
};

export const isValidTaskRecurrenceCron = (cronExpression: string): boolean => {
	return isValidCronExpression(cronExpression);
};

export const getNextTaskRecurrenceDate = ({
	currentDate,
	cronExpression,
}: {
	currentDate: Date;
	cronExpression: string;
}): Date => {
	const referenceDate = Number.isNaN(currentDate.getTime())
		? new Date()
		: new Date(currentDate);

	if (isValidCronExpression(cronExpression)) {
		const nextDate = getNextCronRun({
			currentDate: referenceDate,
			cronExpression,
		});
		if (nextDate) {
			return nextDate;
		}
	}

	const legacyRecurrence = parseLegacyRecurrence(cronExpression);
	if (legacyRecurrence) {
		return getNextLegacyRecurrenceDate({
			currentDate: referenceDate,
			recurrence: legacyRecurrence,
		});
	}

	throw new Error("Invalid recurring cron expression");
};
