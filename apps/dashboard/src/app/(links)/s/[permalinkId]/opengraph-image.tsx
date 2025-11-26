import { ImageResponse } from "next/og";
import { ProjectShareableOgImage } from "@/components/shareables/project/project";
import { TaskShareableOgImage } from "@/components/shareables/task";
import { trpcClient } from "@/utils/trpc";

// Image metadata
export const alt = "About Acme";
export const size = {
	width: 1200,
	height: 630,
};

export const contentType = "image/png";

type Props = {
	params: Promise<{
		permalinkId: string;
	}>;
};

// Image generation
export default async function Image({ params }: Props) {
	const { permalinkId } = await params;

	const resource = await trpcClient.shareable.getResource.query({
		id: permalinkId,
	});

	if (!resource?.data) {
		return null;
	}

	return new ImageResponse(
		// ImageResponse JSX element
		resource.type === "task" ? (
			<TaskShareableOgImage task={resource.data} />
		) : resource.type === "project" ? (
			<ProjectShareableOgImage project={resource.data} />
		) : (
			<div />
		),
		// ImageResponse options
		{
			// For convenience, we can re-use the exported opengraph-image
			// size config to also set the ImageResponse's width and height.
			...size,
		},
	);
}
