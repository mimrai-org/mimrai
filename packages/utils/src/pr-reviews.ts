export type PrReviewLike = {
	title: string;
	body?: string;
	state: string; // e.g. "open" | "closed"
	draft?: boolean;
	merged?: boolean;
	status?:
		| "pending"
		| "closed"
		| "approved"
		| "changes_requested"
		| "reviewed"
		| "review_requested";
	reviewersUserIds?: string[];
};

export type MagicActionStatus = "done" | "in_progress" | "review";

export type MagicTaskAction = {
	sequence: number;
	prefix: string;
	magicWord: string;
	status: MagicActionStatus;
};

const CLOSE_WORDS = [
	"close",
	"closes",
	"closed",
	"fix",
	"fixes",
	"fixed",
	"resolve",
	"resolves",
	"resolved",
];

const PROGRESS_WORDS = [
	"address",
	"addresses",
	"addressed",
	"implement",
	"implements",
	"implemented",
	"refs",
	"references",
	"refers",
	"wip",
	"works-on",
	"working-on",
	"progress",
	"starts",
	"start",
];

const ALL_MAGIC_WORDS = [...CLOSE_WORDS, ...PROGRESS_WORDS];

function computeActionStatus(
	pr: PrReviewLike,
	magicWord: string,
): MagicActionStatus {
	const normalized = magicWord.toLowerCase();
	if (CLOSE_WORDS.includes(normalized)) {
		if (pr.merged) return "done";
	}

	// Indicators that the PR is under active review
	if (
		pr.status === "review_requested" ||
		pr.status === "reviewed" ||
		pr.status === "changes_requested" ||
		pr.status === "approved" ||
		(!!pr.reviewersUserIds && pr.reviewersUserIds.length > 0)
	) {
		return "review";
	}

	return "in_progress";
}

/**
 * Extracts magic task actions (e.g., "Resolves CON-11") from a PR review row.
 * Scans both `title` and `body` fields.
 */
export function extractMagicTaskActions(pr: PrReviewLike): MagicTaskAction[] {
	const text = `${pr.title}\n${pr.body ?? ""}`;
	const words = ALL_MAGIC_WORDS.map((w) =>
		w.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"),
	);
	const pattern = new RegExp(
		`\\b(${words.join("|")})\\b\\s+([A-Z][A-Z0-9]{1,10})-(\\d+)`,
		"gi",
	);

	const results: MagicTaskAction[] = [];
	for (const match of text.matchAll(pattern)) {
		const magicWordRaw = match[1]!;
		const prefixRaw = match[2]!;
		const sequenceRaw = match[3]!;
		const prefix = prefixRaw.toUpperCase();
		const sequence = Number.parseInt(sequenceRaw, 10);
		if (Number.isNaN(sequence)) continue;

		results.push({
			sequence,
			prefix,
			magicWord: magicWordRaw,
			status: computeActionStatus(pr, magicWordRaw),
		});
	}

	return results;
}

/** Returns the first magic task action found, or null if none. */
export function extractFirstMagicTaskAction(
	pr: PrReviewLike,
): MagicTaskAction | null {
	const all = extractMagicTaskActions(pr);
	return all[0] ?? null;
}
