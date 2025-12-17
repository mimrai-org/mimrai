"use client";

import { InlineCommentItem } from "./item";
import { useInlineComments } from "./use-inline-comments";

export const ZenModeInlineCommentList = () => {
	const { stackedComments, currentTask, registerItemRef, measureHeights } =
		useInlineComments();

	if (stackedComments.length === 0) return null;

	return (
		<>
			{stackedComments.map((comment) => (
				<InlineCommentItem
					key={comment.id}
					comment={comment}
					taskId={currentTask.id}
					registerRef={registerItemRef}
					onHeightChange={measureHeights}
				/>
			))}
		</>
	);
};
